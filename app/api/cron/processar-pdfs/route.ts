import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { gerarPDFParaContrato } from '@/lib/contrato-gerar'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: jobs } = await admin.from('pdf_jobs')
    .select('id, contrato_id, tentativas')
    .eq('status', 'pendente')
    .lt('tentativas', 3)
    .order('created_at')
    .limit(5)

  let processados = 0
  let erros = 0

  for (const job of jobs ?? []) {
    const novasTentativas = job.tentativas + 1

    const { data: locked } = await admin.from('pdf_jobs')
      .update({ status: 'processando', tentativas: novasTentativas })
      .eq('id', job.id)
      .eq('status', 'pendente')
      .select('id')

    if (!locked?.length) continue

    if (!job.contrato_id) {
      await admin.from('pdf_jobs')
        .update({ status: 'erro', erro: 'contrato_id ausente', processado_em: new Date().toISOString() })
        .eq('id', job.id)
      erros++
      continue
    }

    const { data: contrato } = await admin.from('contratos')
      .select('*')
      .eq('id', job.contrato_id)
      .maybeSingle()

    if (!contrato) {
      await admin.from('pdf_jobs')
        .update({ status: 'erro', erro: 'Contrato não encontrado', processado_em: new Date().toISOString() })
        .eq('id', job.id)
      erros++
      continue
    }

    const result = await gerarPDFParaContrato(admin, contrato)
    const now = new Date().toISOString()

    if (result.ok) {
      await admin.from('pdf_jobs')
        .update({ status: 'concluido', processado_em: now })
        .eq('id', job.id)
      processados++
    } else {
      const statusFinal = novasTentativas >= 3 ? 'erro' : 'pendente'
      await admin.from('pdf_jobs')
        .update({ status: statusFinal, erro: result.erro, processado_em: now })
        .eq('id', job.id)
      erros++
      captureException(new Error(result.erro ?? 'Erro ao gerar PDF'), {
        endpoint: 'cron/processar-pdfs',
        extra: { job_id: job.id, contrato_id: job.contrato_id, tentativas: novasTentativas },
      })
    }
  }

  return NextResponse.json({ ok: true, processados, erros, total: jobs?.length ?? 0 })
}
