import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
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

  // Salva cada TXID em webhook_events e retorna 200 imediatamente.
  // O processamento real acontece no cron /api/cron/processar-webhooks (a cada 1min).
  // ignoreDuplicates garante idempotência: mesmo txid não entra duas vezes.
  for (const pag of pagamentos) {
    const txid = pag.txid
    if (!txid) continue

    await adminClient.from('webhook_events')
      .upsert(
        { fonte: 'efi', txid, payload: pag as unknown as Json, status: 'pendente' },
        { onConflict: 'fonte,txid', ignoreDuplicates: true }
      )
  }

  return NextResponse.json({ ok: true })
}
