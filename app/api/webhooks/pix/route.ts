import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// Efí envia POST neste endpoint quando pagamento é confirmado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pagamentos = body?.pix ?? []

    const adminClient = createServiceRoleClient()

    for (const pag of pagamentos) {
      const txid = pag.txid
      if (!txid) continue

      // ── Pagamento de cliente SaaS ──
      const { data: cobranca } = await (adminClient.from('cobrancas') as any)
        .select('id, cliente_id, valor')
        .eq('txid', txid)
        .maybeSingle()

      if (cobranca) {
        await (adminClient.from('cobrancas') as any)
          .update({ status: 'pago', pago_em: new Date().toISOString() })
          .eq('id', cobranca.id)

        await (adminClient.from('clientes') as any)
          .update({ ativo: true, status_pagamento: 'em_dia', ultimo_pagamento: new Date().toISOString().split('T')[0], pix_txid: null })
          .eq('id', cobranca.cliente_id)

        const { data: cliente } = await (adminClient.from('clientes') as any)
          .select('nome, contato_whatsapp').eq('id', cobranca.cliente_id).maybeSingle()

        if (cliente?.contato_whatsapp) {
          const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          await enviarWhatsApp(cliente.contato_whatsapp, `✅ *Pagamento confirmado!*\n\n${cliente.nome}\nValor: *${valor}*\n\nSeu acesso está ativo. Obrigado!`)
        }
        continue
      }

      // ── Pagamento de mensalidade do gestor ──
      const { data: pagGestor } = await (adminClient.from('gestor_pagamentos') as any)
        .select('id, gestor_id, valor')
        .eq('txid', txid)
        .maybeSingle()

      if (pagGestor) {
        await (adminClient.from('gestor_pagamentos') as any)
          .update({ status: 'pago', pago_em: new Date().toISOString() })
          .eq('id', pagGestor.id)

        // Ativa plano por 30 dias (e ativa conta se era upgrade de free)
        const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: gestor } = await (adminClient.from('gestores') as any)
          .select('id, nome, whatsapp, ativo, status_assinatura')
          .eq('id', pagGestor.gestor_id)
          .maybeSingle()

        if (gestor) {
          const eraUpgrade = !gestor.ativo || gestor.status_assinatura === 'pendente_upgrade'
          await (adminClient.from('gestores') as any)
            .update({ ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
            .eq('id', gestor.id)

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br'
          const valor = Number(pagGestor.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          if (gestor.whatsapp) {
            const msg = eraUpgrade
              ? `🚀 *Bem-vindo ao UNIAVP PRO!*\n\nOlá, ${gestor.nome}!\n\n✅ Pagamento de *${valor}* confirmado!\n\nSua conta PRO está ativa por 30 dias. Acesse agora seu painel:\n👉 ${appUrl}/pro\n\n_Use o mesmo e-mail e senha que você usava no plano FREE._`
              : `✅ *Pagamento confirmado!*\n\nOlá, ${gestor.nome}!\nValor: *${valor}*\n\nSeu acesso UNIAVP PRO está ativo por mais 30 dias. 🎉\n👉 ${appUrl}/pro`
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
