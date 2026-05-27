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

  return NextResponse.json({ ok: true, processados, erros, total: eventos?.length ?? 0 })
}
