import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'

export const dynamic = 'force-dynamic'

// Roda diariamente às 9h — envia mensagens de boas-vindas nos dias 1, 3, 7
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createServiceRoleClient()
  const appUrl = await getAppUrl()
  const agora = new Date()
  let enviados = 0

  const { data: alunos } = await (admin.from('alunos') as any)
    .select('id, nome, whatsapp, gestor_nome, created_at')
    .eq('status', 'ativo')

  for (const a of alunos ?? []) {
    const dias = Math.floor((agora.getTime() - new Date(a.created_at).getTime()) / 86400000)

    if (dias === 1) {
      await enviarWhatsApp(a.whatsapp,
        `🎓 Olá *${a.nome}*! Seja bem-vindo(a)!\n\nSua jornada de formação começa agora. Acesse a plataforma e assista sua primeira aula:\n👉 ${appUrl}/login\n\nQualquer dúvida, seu gestor *${a.gestor_nome}* está aqui para te ajudar! 💪`)
      enviados++
    }

    if (dias === 3) {
      const { data: prog } = await (admin.from('progresso') as any).select('id').eq('aluno_id', a.id).limit(1).maybeSingle()
      if (!prog) {
        await enviarWhatsApp(a.whatsapp,
          `⏰ *${a.nome}*, você se cadastrou há 3 dias mas ainda não assistiu nenhuma aula!\n\nSua formação está te esperando. São apenas alguns minutos por dia que vão mudar seu resultado:\n👉 ${appUrl}/login\n\nVamos lá? 🚀`)
        enviados++
      }
    }

    if (dias === 7) {
      const { count } = await (admin.from('progresso') as any).select('id', { count: 'exact', head: true }).eq('aluno_id', a.id).eq('aprovado', true)
      if ((count ?? 0) === 0) {
        await enviarWhatsApp(a.whatsapp,
          `🔔 *${a.nome}*, já faz 1 semana desde o seu cadastro!\n\nSeus colegas já estão avançando na formação. Não fique para trás — cada aula assistida te aproxima do certificado oficial.\n\n👉 ${appUrl}/login\n\nPrecisando de ajuda? Fale com seu gestor *${a.gestor_nome}* agora mesmo! 📞`)
        enviados++
      }
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
