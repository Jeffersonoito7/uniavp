import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'

// Roda diariamente — avisa consultor que aula vai expirar em 7 dias
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const agora = new Date()
  let avisos = 0

  const { data: progressos } = await (admin.from('progresso') as any)
    .select('id, aluno_id, aula_id, created_at, aluno:alunos(nome, whatsapp), aula:aulas(titulo, validade_meses)')
    .eq('aprovado', true)
    .not('aula.validade_meses', 'is', null)

  for (const p of progressos ?? []) {
    if (!p.aula?.validade_meses || !p.aluno?.whatsapp) continue
    const expira = new Date(p.created_at)
    expira.setMonth(expira.getMonth() + p.aula.validade_meses)
    const diasParaExpirar = Math.ceil((expira.getTime() - agora.getTime()) / 86400000)

    if (diasParaExpirar === 7) {
      await enviarWhatsApp(p.aluno.whatsapp,
        `⚠️ *${p.aluno.nome}*, sua certificação na aula *"${p.aula.titulo}"* expira em *7 dias*!\n\nPara manter seu certificado válido, você precisará refazer o quiz desta aula.\n\n👉 ${process.env.NEXT_PUBLIC_APP_URL}/login`)
      avisos++
    }
    if (diasParaExpirar === 1) {
      await enviarWhatsApp(p.aluno.whatsapp,
        `🚨 *${p.aluno.nome}*, sua certificação em *"${p.aula.titulo}"* expira *AMANHÃ*!\n\nAcesse agora e refaça o quiz para não perder:\n👉 ${process.env.NEXT_PUBLIC_APP_URL}/login`)
      avisos++
    }
  }

  return NextResponse.json({ ok: true, avisos })
}
