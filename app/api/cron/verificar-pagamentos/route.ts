import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { consultarPagamento } from '@/lib/efi'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // segundos — máximo permitido no plano Pro

// Roda a cada minuto — verifica TXIDs pendentes e ativa planos pagos
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()
  const appUrl = await getAppUrl()
  let ativados = 0

  // ── 1. Mensalidades de gestores PRO ──────────────────────────────
  const { data: pagamentos } = await admin.from('gestor_pagamentos')
    .select('id, gestor_id, valor, txid')
    .eq('status', 'pendente')
    .not('txid', 'is', null)

  for (const pag of pagamentos ?? []) {
    try {
      const { pago } = await consultarPagamento(pag.txid)
      if (!pago) continue

      // Update atômico — evita race condition com o webhook
      const { data: atualizado } = await admin.from('gestor_pagamentos')
        .update({ status: 'pago', pago_em: new Date().toISOString() })
        .eq('id', pag.id)
        .eq('status', 'pendente')
        .select('id')
      if (!atualizado?.length) continue // Já processado pelo webhook

      const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: gestor } = await admin.from('gestores')
        .select('id, nome, whatsapp, ativo, status_assinatura, tenant_id')
        .eq('id', pag.gestor_id)
        .maybeSingle()

      if (gestor) {
        const eraUpgrade = !gestor.ativo || gestor.status_assinatura === 'pendente_upgrade'

        await admin.from('gestores')
          .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
          .eq('id', gestor.id)

        if (gestor.whatsapp) {
          // Busca nome da plataforma do tenant para personalizar a mensagem
          let nomePlataforma = 'Plataforma PRO'
          if (gestor.tenant_id) {
            const { data: cfg } = await admin.from('configuracoes')
              .select('valor').eq('chave', 'site_nome').eq('tenant_id', gestor.tenant_id).maybeSingle()
            try { nomePlataforma = JSON.parse(String(cfg?.valor ?? '')) || nomePlataforma } catch { /**/ }
          }

          const valor = Number(pag.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const msg = eraUpgrade
            ? `🚀 *Bem-vindo ao ${nomePlataforma} PRO!*\n\nOlá, ${gestor.nome}!\n\n✅ Pagamento de *${valor}* confirmado!\n\nSua conta PRO está ativa por 30 dias. Acesse agora:\n👉 ${appUrl}/pro\n\n_Use o mesmo e-mail e senha do plano FREE._`
            : `✅ *Pagamento confirmado!*\n\nOlá, ${gestor.nome}!\nValor: *${valor}*\n\nSeu acesso ${nomePlataforma} PRO está ativo por mais 30 dias. 🎉\n👉 ${appUrl}/pro`
          await enviarWhatsApp(gestor.whatsapp, msg)
        }
      }

      ativados++
    } catch (e: any) {
      console.error(`[cron/pagamentos] Erro ao processar gestor_pagamento ${pag.id}:`, e.message)
    }
  }

  // ── 2. Cobranças de clientes SaaS ────────────────────────────────
  const { data: cobrancas } = await admin.from('cobrancas')
    .select('id, cliente_id, valor, txid')
    .eq('status', 'pendente')
    .not('txid', 'is', null)

  for (const cob of cobrancas ?? []) {
    if (!cob.txid || !cob.cliente_id) continue
    try {
      const { pago } = await consultarPagamento(cob.txid)
      if (!pago) continue

      // Update atômico — evita race condition com o webhook
      const { data: atualizado } = await admin.from('cobrancas')
        .update({ status: 'pago', pago_em: new Date().toISOString() })
        .eq('id', cob.id)
        .eq('status', 'pendente')
        .select('id')
      if (!atualizado?.length) continue // Já processado pelo webhook

      await admin.from('clientes')
        .update({ ativo: true, status_pagamento: 'em_dia', ultimo_pagamento: new Date().toISOString().split('T')[0], pix_txid: null })
        .eq('id', cob.cliente_id)

      const { data: cliente } = await admin.from('clientes')
        .select('nome, contato_whatsapp').eq('id', cob.cliente_id).maybeSingle()

      if (cliente?.contato_whatsapp) {
        const valor = Number(cob.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        await enviarWhatsApp(cliente.contato_whatsapp, `✅ *Pagamento confirmado!*\n\n${cliente.nome}\nValor: *${valor}*\n\nSeu acesso está ativo. Obrigado!`)
      }

      ativados++
    } catch (e: any) {
      console.error(`[cron/pagamentos] Erro ao processar cobranca ${cob.id}:`, e.message)
    }
  }

  return NextResponse.json({ ok: true, ativados, verificados: (pagamentos?.length ?? 0) + (cobrancas?.length ?? 0) })
}
