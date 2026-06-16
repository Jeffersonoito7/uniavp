import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { processarPixTxid } from '@/lib/pix-processor'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: eventos } = await admin.from('webhook_events')
    .select('id, txid, tentativas, fonte')
    .in('status', ['pendente', 'erro'])
    .lt('tentativas', 3)
    .order('created_at')
    .limit(10)

  let processados = 0
  let erros = 0

  for (const evento of eventos ?? []) {
    const novasTentativas = evento.tentativas + 1

    const { data: locked } = await admin.from('webhook_events')
      .update({ status: 'processando', tentativas: novasTentativas })
      .in('status', ['pendente', 'erro'])
      .eq('id', evento.id)
      .select('id')

    if (!locked?.length) continue

    try {
      await processarPixTxid(evento.txid, admin)
      await admin.from('webhook_events')
        .update({ status: 'processado', processado_em: new Date().toISOString() })
        .eq('id', evento.id)
      processados++
    } catch (e: any) {
      const statusFinal = novasTentativas >= 3 ? 'erro' : 'pendente'
      await admin.from('webhook_events')
        .update({ status: statusFinal, erro: e?.message ?? String(e) })
        .eq('id', evento.id)
      erros++
      captureException(e, {
        endpoint: 'cron/processar-webhooks',
        extra: { evento_id: evento.id, txid: evento.txid, tentativas: novasTentativas },
      })
    }
  }

  // Alerta admin se há webhooks travados em erro por mais de 30 min
  const { count: travados } = await admin.from('webhook_events')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'erro')
    .gte('tentativas', 3)
    .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) as { count: number | null }

  if ((travados ?? 0) >= 2) {
    captureException(new Error(`webhook_events: ${travados} pagamentos com erro permanente na última 30 min`), {
      endpoint: 'cron/processar-webhooks',
      extra: { travados },
    })
  }

  return NextResponse.json({ ok: true, processados, erros, travados: travados ?? 0, total: eventos?.length ?? 0 })
}
