import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

// Vercel Cron: roda todo dia às 12h (UTC)
const DIAS_ALERTA = [3, 7, 15]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const adminClient = createServiceRoleClient()
  const agora = new Date()
  const appUrl = await getAppUrl()
  const siteConfig = await getSiteConfig()
  const nomePlat = siteConfig.nome || 'Universidade'
  let notificacoes = 0

  const { data: alunos } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, gestor_nome, gestor_whatsapp, status, created_at')
    .eq('status', 'ativo')

  for (const aluno of alunos ?? []) {
    const { data: ultimoProgresso } = await (adminClient.from('progresso') as any)
      .select('created_at')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataRef = ultimoProgresso
      ? new Date(ultimoProgresso.created_at)
      : new Date(aluno.created_at ?? agora)

    const dias = Math.floor((agora.getTime() - dataRef.getTime()) / 86400000)

    if (!DIAS_ALERTA.includes(dias)) continue

    // 1. Avisa o próprio consultor
    if (aluno.whatsapp) {
      const msgConsultor = dias === 3
        ? `📚 Olá, *${aluno.nome}*! Sentimos sua falta na *${nomePlat}*.\n\nFaz ${dias} dias que você não avança nos estudos. Que tal retomar agora?\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
        : dias === 7
        ? `⏰ *${aluno.nome}*, já faz uma semana sem estudar!\n\nSeu progresso está esperando por você na *${nomePlat}*. Não perca o fio! 💪\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
        : `🚨 *${aluno.nome}*, ${dias} dias sem acessar a plataforma!\n\nNão deixe sua formação parar aqui. Volte agora e continue de onde parou.\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
      await enviarWhatsApp(aluno.whatsapp, msgConsultor)
      notificacoes++
    }

    // 2. Avisa o gestor
    if (aluno.gestor_whatsapp) {
      const instancia = await getInstanciaGestorPorNome(aluno.gestor_nome, adminClient)
      const msgGestor = dias === 15
        ? `⚠️ *Alerta, ${aluno.gestor_nome || 'Gestor'}!*\n\nSeu consultor *${aluno.nome}* está há *${dias} dias* sem acessar a plataforma. Risco de abandono! 📞`
        : `📊 *Lembrete, ${aluno.gestor_nome || 'Gestor'}!*\n\nSeu consultor *${aluno.nome}* está há *${dias} dias* sem avançar. Um contato pode fazer a diferença! 💪`
      await enviarWhatsApp(aluno.gestor_whatsapp, msgGestor, instancia)
      notificacoes++
    }
  }

  return NextResponse.json({ ok: true, notificacoes, alunos_verificados: alunos?.length ?? 0 })
}
