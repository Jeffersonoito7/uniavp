/**
 * Logica compartilhada de processamento de TXIDs PIX.
 * Usada pelo webhook /api/webhooks/pix e pelo cron processar-webhooks.
 */

import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsAppComFila, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { consultarPagamento } from '@/lib/efi'
import { audit } from '@/lib/audit'
import { getMensagem } from '@/lib/mensagem'
import { createLogger } from '@/lib/logger'
import { creditarCreditos, garantirRegistroCredito } from '@/lib/agente-creditos'
import { vencimentoMeses } from '@/lib/date-utils'

const log = createLogger('pix-processor')

/**
 * Ao virar PRO, busca alunos que eram do gestor no FREE e estao com whatsapp em formato diferente.
 * Ex: gestor_whatsapp='11999999999' mas PRO tem whatsapp='5511999999999'.
 * Atualiza gestor_whatsapp e gestor_nome para o formato canonico do PRO.
 */
export async function vincularAlunosDoGestorNoFree(
  gestorWhatsapp: string,
  gestorNome: string,
  adminClient: ReturnType<typeof createServiceRoleClient>
): Promise<{ atualizados: number }> {
  const wpp = gestorWhatsapp
  const wppSemDDI = wpp.startsWith('55') && wpp.length > 11 ? wpp.slice(2) : null
  const wppComDDI = !wpp.startsWith('55') ? `55${wpp}` : null
  const variacoes = [wppSemDDI, wppComDDI].filter(Boolean) as string[]

  if (variacoes.length === 0) return { atualizados: 0 }

  const { data: alunosErrados } = await adminClient
    .from('alunos')
    .select('id')
    .in('gestor_whatsapp', variacoes)

  if (!alunosErrados?.length) return { atualizados: 0 }

  const ids = alunosErrados.map(a => a.id)
  const { error } = await adminClient
    .from('alunos')
    .update({ gestor_whatsapp: wpp, gestor_nome: gestorNome })
    .in('id', ids)

  if (error) throw new Error(error.message)

  log.info('alunos do free vinculados ao PRO', { gestorWhatsapp: wpp, atualizados: ids.length })
  return { atualizados: ids.length }
}

export async function processarPixTxid(
  txid: string,
  adminClient: ReturnType<typeof createServiceRoleClient>
): Promise<{ processado: boolean; motivo?: string }> {
  const { pago } = await consultarPagamento(txid)
  // Lança para que o webhook_event fique como 'erro' e seja reprocessado pelo cron.
  // O cron verificar-pagamentos também tem sua própria varredura, mas manter
  // webhook_events consistente facilita o diagnóstico de falhas.
  if (!pago) throw new Error('pagamento_nao_confirmado')

  // ── Cobrança SaaS ─────────────────────────────────────────────────────────
  const { data: cobranca } = await adminClient.from('cobrancas')
    .select('id, cliente_id, valor')
    .eq('txid', txid)
    .maybeSingle()

  if (cobranca) {
    const { data: atualizado } = await adminClient.from('cobrancas')
      .update({ status: 'pago', pago_em: new Date().toISOString() })
      .eq('id', cobranca.id)
      .eq('status', 'pendente')
      .select('id')
    if (!atualizado?.length) return { processado: true, motivo: 'ja_processado' }

    const { data: cliente } = await adminClient.from('clientes')
      .select('id, nome, dominio, contato_whatsapp, contato_nome, contato_email, gestor_ativo, limite_consultores, status_pagamento, observacoes')
      .eq('id', cobranca.cliente_id!).maybeSingle()

    await adminClient.from('clientes')
      .update({ ativo: true, status_pagamento: 'em_dia', ultimo_pagamento: new Date().toISOString().split('T')[0], pix_txid: null })
      .eq('id', cobranca.cliente_id!)

    await audit({
      acao: 'pagamento.confirmado',
      entidade: 'cobrancas',
      entidade_id: String(cobranca.id),
      usuario_tipo: 'sistema',
      dados_novos: { txid, valor: cobranca.valor, cliente_id: cobranca.cliente_id },
    })

    if (cliente?.status_pagamento === 'aguardando_pagamento' && cliente.observacoes) {
      try {
        const obs = JSON.parse(cliente.observacoes)
        const signup = obs._signup
        if (signup?.admin_email) {
          const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
            email: signup.admin_email, email_confirm: true,
          })
          if (!authErr && authUser?.user) {
            const { error: insertErr } = await adminClient.from('admins').insert({
              user_id: authUser.user.id, nome: signup.admin_nome || cliente.contato_nome,
              email: signup.admin_email, ativo: true, role: 'admin', tenant_id: cliente.id,
            })
            if (insertErr) {
              await adminClient.auth.admin.deleteUser(authUser.user.id)
              throw new Error(`Falha ao criar admin: ${insertErr.message}`)
            }

            const base = cliente.dominio ? `https://${cliente.dominio}` : process.env.NEXT_PUBLIC_APP_URL || ''
            const linkAdmin = cliente.dominio ? `https://adm.${cliente.dominio}/admin` : `${base}/admin`
            const linkFree = cliente.dominio ? `https://free.${cliente.dominio}/captacao` : `${base}/captacao`

            const { data: linkData } = await adminClient.auth.admin.generateLink({
              type: 'recovery',
              email: signup.admin_email,
              options: { redirectTo: linkAdmin },
            })
            const linkSenha = linkData?.properties?.action_link ?? `${base}/recuperar-senha`

            let dominiosOk = true
            if (cliente.dominio) {
              const { registrarDominiosTenant } = await import('@/lib/tenant')
              const dominios = [cliente.dominio, `adm.${cliente.dominio}`, `free.${cliente.dominio}`, `pro.${cliente.dominio}`]
              await registrarDominiosTenant(cliente.id, dominios).catch((e) => {
                log.error('falha ao registrar domínios', { err: String(e) })
                dominiosOk = false
              })

              if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
                for (const sub of [`free.${cliente.dominio}`, `pro.${cliente.dominio}`, `adm.${cliente.dominio}`]) {
                  const res = await fetch(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: sub }),
                  }).catch((e) => { log.error(`falha Vercel domain ${sub}`, { err: String(e) }); return null })
                  if (res && !res.ok) log.error(`Vercel rejeitou domínio ${sub}`, { status: res.status })
                }
              }

              if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
                for (const prefix of ['free', 'pro', 'adm']) {
                  const name = `${prefix}.${cliente.dominio.split('.').slice(1).join('.')}`
                  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'CNAME', name, content: cliente.dominio, proxied: true, ttl: 1 }),
                  }).catch((e) => { log.error(`falha Cloudflare DNS ${name}`, { err: String(e) }); return null })
                  if (res && !res.ok) { log.error(`Cloudflare rejeitou DNS ${name}`, { status: res.status }); dominiosOk = false }
                }
              }
            }

            await adminClient.from('clientes').update({ observacoes: null }).eq('id', cliente.id)

            if (cliente.contato_whatsapp) {
              const avisodominio = !dominiosOk ? `\n\n_Configuração de domínio personalizado pendente — entre em contato com o suporte._` : ''
              const msgOnboarding = await getMensagem('onboarding_novo_cliente', {
                contatoNome: cliente.contato_nome || cliente.nome, linkSenha, linkFree,
              }, adminClient) + avisodominio
              await enviarWhatsAppComFila(cliente.contato_whatsapp, msgOnboarding, null, adminClient, cliente.id)
            }
          }
        }
      } catch (e) {
        log.error('erro no onboarding automático', { err: String(e) })
        throw e
      }
    } else if (cliente?.contato_whatsapp) {
      const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      await enviarWhatsAppComFila(
        cliente.contato_whatsapp,
        await getMensagem('pagamento_cliente_confirmado', { clienteNome: cliente.nome, valor }, adminClient),
        null, adminClient, cliente.id,
      )
    }

    return { processado: true }
  }

  // ── Mensalidade do gestor ─────────────────────────────────────────────────
  const { data: pagGestor } = await adminClient.from('gestor_pagamentos')
    .select('id, gestor_id, valor, plano_meses, status')
    .eq('txid', txid)
    .maybeSingle()

  if (pagGestor) {
    // Tenta marcar o pagamento como pago (idempotente: só atualiza se ainda pendente).
    // Não retorna imediatamente se já estava pago — precisa garantir que o gestor
    // também foi ativado, pois uma falha entre as duas updates deixaria o usuário preso.
    let pagamentoJaMarcado = pagGestor.status === 'pago'

    if (!pagamentoJaMarcado) {
      const { data: atualizadoGestor } = await adminClient.from('gestor_pagamentos')
        .update({ status: 'pago', pago_em: new Date().toISOString() })
        .eq('id', pagGestor.id)
        .eq('status', 'pendente')
        .select('id')
      if (!atualizadoGestor?.length) {
        // Outra instância atualizou antes de nós — assume marcado
        pagamentoJaMarcado = true
      }
    }

    const vencimento = vencimentoMeses(pagGestor.plano_meses ?? 1)
    const { data: gestor } = await adminClient.from('gestores')
      .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id')
      .eq('id', pagGestor.gestor_id)
      .maybeSingle()

    if (!gestor) {
      log.error('gestor nao encontrado para pagamento', { gestor_id: pagGestor.gestor_id, txid })
      return { processado: pagamentoJaMarcado, motivo: 'gestor_nao_encontrado' }
    }

    // Ativa o gestor sempre que ele ainda não estiver ativo, mesmo que o pagamento
    // já tenha sido marcado. Isso cobre o cenário de crash entre as duas updates.
    const precisaAtivar = !gestor.ativo || gestor.status_assinatura !== 'ativo'

    if (precisaAtivar) {
      const eraUpgrade = !gestor.ativo || gestor.status_assinatura === 'pendente_upgrade'

      const { error: updateErr } = await adminClient.from('gestores')
        .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
        .eq('id', gestor.id)

      // Falha no update → lança para que o cron reprocesse
      if (updateErr) throw new Error(`Falha ao ativar gestor ${gestor.id}: ${updateErr.message}`)

      await audit({
        acao: 'pagamento.confirmado',
        entidade: 'gestor_pagamentos',
        entidade_id: String(pagGestor.id),
        usuario_tipo: 'sistema',
        dados_novos: { txid, valor: pagGestor.valor, gestor_id: pagGestor.gestor_id, recuperado: pagamentoJaMarcado },
      })

      const appUrl = await getAppUrl(gestor.tenant_id)
      const valor = Number(pagGestor.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

      if (gestor.whatsapp) {
        const instancia = await getInstanciaTenant(gestor.tenant_id, adminClient)
        const chave = eraUpgrade ? 'pagamento_gestor_upgrade' : 'pagamento_gestor_renovacao'
        const msg = await getMensagem(chave, { gestorNome: gestor.nome, valor, appUrl }, adminClient, gestor.tenant_id)
        await enviarWhatsAppComFila(gestor.whatsapp, msg, instancia, adminClient, gestor.tenant_id)
      }

      if (eraUpgrade) {
        try {
          const { concederCreditosBoasVindas } = await import('@/lib/pro-agente')
          await concederCreditosBoasVindas(gestor.id, gestor.tenant_id ?? null, adminClient)
        } catch (e) {
          log.error('falha ao conceder créditos boas-vindas', { err: String(e), gestorId: gestor.id })
        }

        // Puxa automaticamente alunos que eram do gestor no FREE mas com whatsapp em formato diferente.
        // Caso comum: gestor tinha alunos com gestor_whatsapp='11999999999' e agora é PRO com '5511999999999'.
        try {
          await vincularAlunosDoGestorNoFree(gestor.whatsapp, gestor.nome, adminClient)
        } catch (e) {
          log.error('falha ao vincular alunos do free no upgrade', { err: String(e), gestorId: gestor.id })
        }
      }
    }

    return { processado: true, motivo: precisaAtivar ? undefined : 'ja_processado' }
  }

  // ── Recarga de créditos do agente IA ─────────────────────────────────────
  const { data: recarga } = await adminClient.from('agente_recargas')
    .select('id, gestor_id, tenant_id, creditos, valor')
    .eq('txid', txid)
    .maybeSingle()

  if (recarga) {
    const { data: atualizado } = await adminClient.from('agente_recargas')
      .update({ status: 'pago', pago_em: new Date().toISOString() })
      .eq('id', recarga.id)
      .eq('status', 'pendente')
      .select('id')
    if (!atualizado?.length) return { processado: true, motivo: 'ja_processado' }

    await garantirRegistroCredito(recarga.gestor_id, recarga.tenant_id ?? null, adminClient)
    const novoSaldo = await creditarCreditos(
      recarga.gestor_id,
      recarga.creditos,
      `Recarga via PIX — ${recarga.creditos} créditos`,
      recarga.tenant_id ?? null,
      adminClient,
      { tipo: 'compra', valorPago: Number(recarga.valor), cobrancaId: txid }
    )

    // Notifica o gestor via WhatsApp
    const { data: gestor } = await adminClient.from('gestores')
      .select('whatsapp, nome, tenant_id').eq('id', recarga.gestor_id).maybeSingle()

    if (gestor?.whatsapp) {
      const instancia = await getInstanciaTenant(gestor.tenant_id ?? null, adminClient)
      await enviarWhatsAppComFila(
        gestor.whatsapp,
        `✅ *Recarga confirmada!*\n\n*+${recarga.creditos} créditos* adicionados à sua conta.\n\nSaldo atual: *${novoSaldo} créditos*\n\n_Use o assistente à vontade!_`,
        instancia, adminClient, gestor.tenant_id,
      )
    }

    await audit({
      acao: 'agente.recarga_confirmada',
      entidade: 'agente_recargas',
      entidade_id: recarga.id,
      tenant_id: recarga.tenant_id ?? null,
      usuario_tipo: 'sistema',
      dados_novos: { txid, creditos: recarga.creditos, valor: recarga.valor, gestor_id: recarga.gestor_id },
    })

    return { processado: true }
  }

  return { processado: false, motivo: 'txid_nao_encontrado' }
}
