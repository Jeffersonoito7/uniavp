import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { consultarPagamento } from '@/lib/efi'

export const dynamic = 'force-dynamic'

// Efí envia POST neste endpoint quando pagamento é confirmado
// Nota: Efí requer mTLS no receptor — este endpoint é secundário ao cron de polling
export async function POST(req: NextRequest) {
  try {
    // Valida que o TXID existe no banco antes de processar (proteção contra POST falso)
    const body = await req.json()
    const pagamentos = body?.pix ?? []
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const adminClient = createServiceRoleClient()

    for (const pag of pagamentos) {
      const txid = pag.txid
      if (!txid) continue

      // Verifica diretamente na Efí antes de confiar no webhook (proteção contra POST falso)
      try {
        const { pago } = await consultarPagamento(txid)
        if (!pago) continue
      } catch { continue }

      // ── Pagamento de cliente SaaS ──
      const { data: cobranca } = await adminClient.from('cobrancas')
        .select('id, cliente_id, valor')
        .eq('txid', txid)
        .maybeSingle()

      if (cobranca) {
        // Update atômico — evita race condition com o cron de polling
        const { data: atualizado } = await adminClient.from('cobrancas')
          .update({ status: 'pago', pago_em: new Date().toISOString() })
          .eq('id', cobranca.id)
          .eq('status', 'pendente')
          .select('id')
        if (!atualizado?.length) continue // Já processado pelo cron

        const { data: cliente } = await adminClient.from('clientes')
          .select('id, nome, dominio, contato_whatsapp, contato_nome, contato_email, gestor_ativo, limite_consultores, status_pagamento, observacoes')
          .eq('id', cobranca.cliente_id!).maybeSingle()

        await adminClient.from('clientes')
          .update({ ativo: true, status_pagamento: 'em_dia', ultimo_pagamento: new Date().toISOString().split('T')[0], pix_txid: null })
          .eq('id', cobranca.cliente_id!)

        // ── Onboarding automático para novos clientes (self-service) ──
        if (cliente?.status_pagamento === 'aguardando_pagamento' && cliente.observacoes) {
          try {
            const obs = JSON.parse(cliente.observacoes)
            const signup = obs._signup
            if (signup?.admin_email) {
              // Cria auth user sem senha — acesso via link de definição de senha
              const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
                email: signup.admin_email, email_confirm: true,
              })
              if (!authErr && authUser?.user) {
                // Cria admin vinculado ao tenant — se falhar, desfaz o auth user (evita usuário órfão)
                const { error: insertErr } = await adminClient.from('admins').insert({
                  user_id: authUser.user.id, nome: signup.admin_nome || cliente.contato_nome,
                  email: signup.admin_email, ativo: true, role: 'admin', tenant_id: cliente.id,
                })
                if (insertErr) {
                  await adminClient.auth.admin.deleteUser(authUser.user.id)
                  throw new Error(`Falha ao criar admin (auth revertido): ${insertErr.message}`)
                }

                const base = cliente.dominio ? `https://${cliente.dominio}` : process.env.NEXT_PUBLIC_APP_URL || ''
                const linkAdmin = cliente.dominio ? `https://adm.${cliente.dominio}/admin` : `${base}/admin`
                const linkFree = cliente.dominio ? `https://free.${cliente.dominio}/captacao` : `${base}/captacao`

                // Gera link de definição de senha (expira em 24h) — nunca envia senha em texto plano
                const { data: linkData } = await adminClient.auth.admin.generateLink({
                  type: 'recovery',
                  email: signup.admin_email,
                  options: { redirectTo: linkAdmin },
                })
                const linkSenha = linkData?.properties?.action_link ?? `${base}/recuperar-senha`

                // Registra domínios — captura erros para não deixar cliente sem aviso
                let dominiosOk = true
                if (cliente.dominio) {
                  const { registrarDominiosTenant } = await import('@/lib/tenant')
                  const dominios = [cliente.dominio, `adm.${cliente.dominio}`, `free.${cliente.dominio}`, `pro.${cliente.dominio}`]
                  await registrarDominiosTenant(cliente.id, dominios).catch((e) => {
                    console.error('[onboarding] Falha ao registrar domínios no banco:', e)
                    dominiosOk = false
                  })

                  // Vercel
                  if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID) {
                    for (const sub of [`free.${cliente.dominio}`, `pro.${cliente.dominio}`, `adm.${cliente.dominio}`]) {
                      const res = await fetch(`https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: sub }),
                      }).catch((e) => { console.error(`[onboarding] Falha Vercel domain ${sub}:`, e); return null })
                      if (res && !res.ok) console.error(`[onboarding] Vercel rejeitou domínio ${sub}: ${res.status}`)
                    }
                  }

                  // Cloudflare
                  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
                    for (const prefix of ['free', 'pro', 'adm']) {
                      const name = `${prefix}.${cliente.dominio.split('.').slice(1).join('.')}`
                      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'CNAME', name, content: cliente.dominio, proxied: true, ttl: 1 }),
                      }).catch((e) => { console.error(`[onboarding] Falha Cloudflare DNS ${name}:`, e); return null })
                      if (res && !res.ok) { console.error(`[onboarding] Cloudflare rejeitou DNS ${name}: ${res.status}`); dominiosOk = false }
                    }
                  }
                }

                // Limpa dados sensíveis após onboarding
                await adminClient.from('clientes').update({ observacoes: null }).eq('id', cliente.id)

                // Envia acesso por WhatsApp — link de definição de senha, sem expor credenciais
                if (cliente.contato_whatsapp) {
                  const avisodominio = !dominiosOk ? `\n\n⚠️ _Configuração de domínio personalizado pendente — entre em contato com o suporte._` : ''
                  await enviarWhatsApp(cliente.contato_whatsapp,
                    `🎉 *Bem-vindo à plataforma, ${cliente.contato_nome || cliente.nome}!*\n\n` +
                    `Sua plataforma está pronta.\n\n` +
                    `🔐 *Clique para definir sua senha e acessar o painel:*\n${linkSenha}\n\n` +
                    `_(Link válido por 24 horas)_\n\n` +
                    `🔗 *Link de cadastro dos consultores:*\n${linkFree}` +
                    avisodominio)
                }
              }
            }
          } catch (e) {
            console.error('Erro no onboarding automático:', e)
          }
        } else if (cliente?.contato_whatsapp) {
          // Renovação de mensalidade — apenas confirma pagamento
          const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          await enviarWhatsApp(cliente.contato_whatsapp, `✅ *Pagamento confirmado!*\n\n${cliente.nome}\nValor: *${valor}*\n\nSeu acesso está ativo. Obrigado!`)
        }
        continue
      }

      // ── Pagamento de mensalidade do gestor ──
      const { data: pagGestor } = await adminClient.from('gestor_pagamentos')
        .select('id, gestor_id, valor')
        .eq('txid', txid)
        .maybeSingle()

      if (pagGestor) {
        // Update atômico — evita race condition com o cron de polling
        const { data: atualizadoGestor } = await adminClient.from('gestor_pagamentos')
          .update({ status: 'pago', pago_em: new Date().toISOString() })
          .eq('id', pagGestor.id)
          .eq('status', 'pendente')
          .select('id')
        if (!atualizadoGestor?.length) continue // Já processado pelo cron

        // Ativa plano por 30 dias (e ativa conta se era upgrade de free)
        const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: gestor } = await adminClient.from('gestores')
          .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id')
          .eq('id', pagGestor.gestor_id)
          .maybeSingle()

        if (gestor) {
          const eraUpgrade = !gestor.ativo || gestor.status_assinatura === 'pendente_upgrade'
          await adminClient.from('gestores')
            .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
            .eq('id', gestor.id)

          const appUrl = await getAppUrl(gestor.tenant_id)
          const valor = Number(pagGestor.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          if (gestor.whatsapp) {
            const msg = eraUpgrade
              ? `🚀 *Bem-vindo ao Plano PRO!*\n\nOlá, ${gestor.nome}!\n\n✅ Pagamento de *${valor}* confirmado!\n\nSua conta PRO está ativa por 30 dias. Acesse agora seu painel:\n👉 ${appUrl}/pro\n\n_Use o mesmo e-mail e senha que você usava no plano FREE._`
              : `✅ *Pagamento confirmado!*\n\nOlá, ${gestor.nome}!\nValor: *${valor}*\n\nSeu acesso PRO está ativo por mais 30 dias. 🎉\n👉 ${appUrl}/pro`
            await enviarWhatsApp(gestor.whatsapp, msg)
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // sempre retorna 200 para a Efí não reenviar
  }
}
