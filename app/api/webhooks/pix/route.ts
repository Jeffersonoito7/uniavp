import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'
import type { Json } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { pix?: Array<{ txid?: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const pagamentos = body?.pix ?? []
  if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const adminClient = createServiceRoleClient()

  for (const pag of pagamentos) {
    const txid = pag.txid
    if (!txid) continue

    // Upsert com ignoreDuplicates: se o txid já existe, não processa de novo (idempotência)
    const { data: evento } = await adminClient.from('webhook_events')
      .upsert(
        { fonte: 'efi', txid, payload: pag as unknown as Json, status: 'pendente' },
        { onConflict: 'fonte,txid', ignoreDuplicates: true }
      )
      .select('id')
      .single()
      .then(r => r, () => ({ data: null }))

    // Se não retornou id, o evento já existia — evita reprocessamento
    if (!evento?.id) continue

    try {
      const result = await processarPixTxid(txid, adminClient)
      if (evento?.id) {
        await adminClient.from('webhook_events')
          .update({ status: 'processado', processado_em: new Date().toISOString() })
          .eq('id', evento.id)
      }
      if (!result.processado) {
        // txid ignorado intencionalmente (result.motivo disponível para debug)
      }
    } catch (e: any) {
      captureException(e, { endpoint: 'webhook/pix', extra: { txid } })
      if (evento?.id) {
        await adminClient.from('webhook_events')
          .update({ status: 'erro', erro: e?.message ?? String(e), tentativas: 1 })
          .eq('id', evento.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
