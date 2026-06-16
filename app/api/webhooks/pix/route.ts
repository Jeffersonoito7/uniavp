import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'
import type { Json } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.EFI_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

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

    // Upsert com ignoreDuplicates: garante idempotência.
    // Se o txid já existe em webhook_events, retorna null e pulamos (já foi processado).
    const { data: evento } = await adminClient.from('webhook_events')
      .upsert(
        { fonte: 'efi', txid, payload: pag as unknown as Json, status: 'pendente' },
        { onConflict: 'fonte,txid', ignoreDuplicates: true }
      )
      .select('id')
      .single()
      .then(r => r, () => ({ data: null }))

    if (!evento?.id) continue

    // Processa imediatamente — acesso liberado na hora para o aluno.
    // Em caso de falha, o cron /processar-webhooks retenta até 3x a cada 1min.
    try {
      await processarPixTxid(txid, adminClient)
      await adminClient.from('webhook_events')
        .update({ status: 'processado', processado_em: new Date().toISOString() })
        .eq('id', evento.id)
    } catch (e: any) {
      captureException(e, { endpoint: 'webhook/pix', extra: { txid } })
      await adminClient.from('webhook_events')
        .update({ status: 'erro', erro: e?.message ?? String(e), tentativas: 1 })
        .eq('id', evento.id)
    }
  }

  return NextResponse.json({ ok: true })
}
