import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

// Vercel Cron: roda todo dia às 9h
// vercel.json: { "crons": [{ "path": "/api/cron/inatividade", "schedule": "0 12 * * *" }] }

const DIAS_ALERTA = [3, 7, 15] // alertas em 3, 7 e 15 dias sem avançar

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()
  const agora = new Date()
  let notificacoes = 0

  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, gestor_nome, gestor_whatsapp, status')
    .eq('status', 'ativo')
    .not('gestor_whatsapp', 'is', null)

  for (const aluno of alunos ?? []) {
    const { data: ultimoProgresso } = await (adminClient.from('progresso') as any)
      .select('created_at')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataReferencia = ultimoProgresso
      ? new Date(ultimoProgresso.created_at)
      : new Date(aluno.created_at ?? agora)

    const diasSemAtividade = Math.floor((agora.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24))

    if (DIAS_ALERTA.includes(diasSemAtividade) && aluno.gestor_whatsapp) {
      const msg = diasSemAtividade === 15
        ? `⚠️ *Alerta Importante, ${aluno.gestor_nome || 'Gestor'}!*\n\nSeu consultor *${aluno.nome}* está há *${diasSemAtividade} dias* sem acessar a plataforma.\n\nConsidere entrar em contato para evitar abandono. 📞`
        : `📊 *Lembrete, ${aluno.gestor_nome || 'Gestor'}!*\n\nSeu consultor *${aluno.nome}* está há *${diasSemAtividade} dias* sem avançar na Universidade AVP.\n\nUm contato pode fazer a diferença! 💪`

      await enviarWhatsApp(aluno.gestor_whatsapp, msg)
      notificacoes++
    }
  }

  return NextResponse.json({ ok: true, notificacoes, alunos_verificados: alunos?.length ?? 0 })
}
