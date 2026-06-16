import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { captureException } from '@/lib/monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type FilaMsg = { id: string; numero: string; mensagem: string; instancia: string | null; tentativas: number }

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const admin = createServiceRoleClient()

  const { data: mensagens } = await admin.from('fila_whatsapp')
    .select('id, numero, mensagem, instancia, tentativas')
    .in('status', ['pendente', 'erro'])
    .lt('tentativas', 5)
    .order('created_at')
    .limit(20) as { data: FilaMsg[] | null }

  let enviados = 0
  let erros = 0

  for (const msg of mensagens ?? []) {
    const novasTentativas = msg.tentativas + 1

    // Lock otimista: só processa se ainda estiver pendente/erro
    const { data: locked } = await admin.from('fila_whatsapp')
      .update({ status: 'processando', tentativas: novasTentativas })
      .in('status', ['pendente', 'erro'])
      .eq('id', msg.id)
      .select('id') as { data: { id: string }[] | null }

    if (!locked?.length) continue

    const ok = await enviarWhatsApp(msg.numero, msg.mensagem, msg.instancia)

    if (ok) {
      await admin.from('fila_whatsapp')
        .update({ status: 'enviado', processado_em: new Date().toISOString() })
        .eq('id', msg.id)
      enviados++
    } else {
      const statusFinal = novasTentativas >= 5 ? 'falhou' : 'erro'
      await admin.from('fila_whatsapp')
        .update({ status: statusFinal, erro: 'Falha após retries inline' })
        .eq('id', msg.id)
      erros++
    }
  }

  // Alerta admin se há mensagens que esgotaram todas as tentativas
  const { count: falhas } = await admin.from('fila_whatsapp')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'falhou')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) as { count: number | null }

  if ((falhas ?? 0) >= 3) {
    captureException(new Error(`fila_whatsapp: ${falhas} mensagens falharam na última hora`), {
      endpoint: 'cron/processar-whatsapp',
      extra: { falhas },
    })
  }

  return NextResponse.json({ ok: true, enviados, erros, falhas: falhas ?? 0, total: mensagens?.length ?? 0 })
}
