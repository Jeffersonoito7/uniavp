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

        // Ativa plano por 30 dias
        const vencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        await (adminClient.from('gestores') as any)
          .update({ status_assinatura: 'ativo', plano_vencimento: vencimento, pix_txid: null })
          .eq('id', pagGestor.gestor_id)

        const { data: gestor } = await (adminClient.from('gestores') as any)
          .select('nome, whatsapp').eq('id', pagGestor.gestor_id).maybeSingle()

        if (gestor?.whatsapp) {
          const valor = Number(pagGestor.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          await enviarWhatsApp(
            gestor.whatsapp,
            `✅ *Pagamento confirmado!*\n\nOlá, ${gestor.nome}!\nValor: *${valor}*\n\nSeu acesso ao painel gestor está ativo por 30 dias. 🎉`
          )
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // sempre retorna 200 para a Efí não reenviar
  }
}
