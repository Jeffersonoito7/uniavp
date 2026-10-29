import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'
import type { Json } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { action?: string; data?: { id?: string | number } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  // MP envia action = "payment.updated" ou "payment.created"
  if (!body?.action?.startsWith('payment') || !body?.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body.data.id)
  const adminClient = createServiceRoleClient()

  // Idempotência: se já processamos esse paymentId, retorna 200 direto
  const { data: evento } = await adminClient.from('webhook_events')
    .upsert(
      { fonte: 'mercadopago', txid: paymentId, payload: body as unknown as Json, status: 'pendente' },
      { onConflict: 'fonte,txid', ignoreDuplicates: true }
    )
    .select('id')
    .single()
    .then(r => r, () => ({ data: null }))

  if (!evento?.id) return NextResponse.json({ ok: true })

  try {
    await processarPixTxid(paymentId, adminClient)
    await adminClient.from('webhook_events')
      .update({ status: 'processado', processado_em: new Date().toISOString() })
      .eq('id', evento.id)
  } catch (e: any) {
    captureException(e, { endpoint: 'webhook/mp', extra: { paymentId } })
    await adminClient.from('webhook_events')
      .update({ status: 'erro', erro: e?.message ?? String(e), tentativas: 1 })
      .eq('id', evento.id)
  }

  return NextResponse.json({ ok: true })
}
