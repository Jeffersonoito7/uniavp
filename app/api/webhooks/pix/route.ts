import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

// Efí envia POST neste endpoint quando pagamento é confirmado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pagamentos = body?.pix ?? []

    const adminClient = createServiceRoleClient()

    for (const pag of pagamentos) {
      const txid = pag.txid
      if (!txid) continue

      const { data: cobranca } = await (adminClient.from('cobrancas') as any)
        .select('id, cliente_id, valor')
        .eq('txid', txid)
        .maybeSingle()

      if (!cobranca) continue

      // Marca cobrança como paga
      await (adminClient.from('cobrancas') as any)
        .update({ status: 'pago', pago_em: new Date().toISOString() })
        .eq('id', cobranca.id)

      // Reativa cliente e atualiza último pagamento
      await (adminClient.from('clientes') as any)
        .update({
          ativo: true,
          status_pagamento: 'em_dia',
          ultimo_pagamento: new Date().toISOString().split('T')[0],
          pix_txid: null,
        })
        .eq('id', cobranca.cliente_id)

      // Notifica via WhatsApp
      const { data: cliente } = await (adminClient.from('clientes') as any)
        .select('nome, contato_whatsapp')
        .eq('id', cobranca.cliente_id)
        .maybeSingle()

      if (cliente?.contato_whatsapp) {
        const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        await enviarWhatsApp(
          cliente.contato_whatsapp,
          `✅ *Pagamento confirmado!*\n\n${cliente.nome}\nValor: *${valor}*\n\nSeu acesso está ativo. Obrigado!`
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // sempre retorna 200 para a Efí não reenviar
  }
}
