import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'
import type { Json } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

function validarAssinaturaMP(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return false
  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const ts = xSignature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1] ?? ''
  if (!ts || !v1) return false
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected === v1
}

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

  const dataId = String(body.data.id)
  if (!validarAssinaturaMP(req, dataId)) {
    return NextResponse.json({ erro: 'assinatura_invalida' }, { status: 401 })
  }

  const paymentId = dataId
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
