import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { enviarWhatsApp, getInstanciaGestorPorNome, getInstanciaTenant } from '@/lib/whatsapp'
import { getAppUrl } from '@/lib/get-app-url'
import { getSiteConfig } from '@/lib/site-config'
import { alertarDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

// Vercel Cron: roda todo dia às 12h (UTC)
const DIAS_ALERTA = [3, 7, 15]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
  const adminClient = createServiceRoleClient()
  const agora = new Date()
  const appUrl = await getAppUrl()
  const siteConfig = await getSiteConfig()
  const nomePlat = siteConfig.nome || 'Universidade'
  let notificacoes = 0

  const instanciaCache = new Map<string, string | null>()
  async function instanciaDo(tenantId: string | null) {
    const key = tenantId ?? ''
    if (!instanciaCache.has(key)) instanciaCache.set(key, await getInstanciaTenant(tenantId, adminClient))
    return instanciaCache.get(key) ?? null
  }

  const { data: alunos } = await adminClient.from('alunos')
    .select('id, nome, whatsapp, gestor_nome, gestor_whatsapp, status, created_at, tenant_id')
    .eq('status', 'ativo')

  for (const aluno of alunos ?? []) {
    const { data: ultimoProgresso } = await adminClient.from('progresso')
      .select('created_at')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const dataRef = ultimoProgresso
      ? new Date(ultimoProgresso.created_at ?? agora)
      : new Date(aluno.created_at ?? agora)

    const dias = Math.floor((agora.getTime() - dataRef.getTime()) / 86400000)

    if (!DIAS_ALERTA.includes(dias)) continue

    const instancia = await instanciaDo(aluno.tenant_id ?? null)

    // 1. Avisa o próprio consultor
    if (aluno.whatsapp) {
      const msgConsultor = dias === 3
        ? `📚 Olá, *${aluno.nome}*! Sentimos sua falta na *${nomePlat}*.\n\nFaz ${dias} dias que você não avança nos estudos. Que tal retomar agora?\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
        : dias === 7
        ? `⏰ *${aluno.nome}*, já faz uma semana sem estudar!\n\nSeu progresso está esperando por você na *${nomePlat}*. Não perca o fio! 💪\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
        : `🚨 *${aluno.nome}*, ${dias} dias sem acessar a plataforma!\n\nNão deixe sua formação parar aqui. Volte agora e continue de onde parou.\n\n👉 ${appUrl}/aluno/${aluno.whatsapp}`
      await enviarWhatsApp(aluno.whatsapp, msgConsultor, instancia)
      notificacoes++
    }

    // 2. Avisa o PRO com nível de urgência crescente + link direto para contato
    if (aluno.gestor_whatsapp) {
      const instanciaGestor = await getInstanciaGestorPorNome(aluno.gestor_nome ?? '', adminClient, aluno.tenant_id ?? undefined)
      const wppFree = aluno.whatsapp?.replace(/\D/g, '')
      const linkContato = wppFree ? `\n\n📲 Contatar agora: https://wa.me/55${wppFree}` : ''
      const linkPainel = `\n📊 Ver painel: ${appUrl}/pro`

      const msgGestor = dias === 3
        ? `📬 *${aluno.gestor_nome || 'PRO'}*, seu membro FREE *${aluno.nome}* está há *3 dias* sem estudar.\n\nUma mensagem sua pode ser tudo que ele precisa para retomar! 💪${linkContato}${linkPainel}`
        : dias === 7
        ? `⏰ *Atenção, ${aluno.gestor_nome || 'PRO'}!*\n\nSeu membro FREE *${aluno.nome}* está há *1 semana* sem avançar nos estudos.\n\nEste é o momento certo para um reengajamento direto. Entre em contato agora! 🎯${linkContato}${linkPainel}`
        : `🚨 *ALERTA, ${aluno.gestor_nome || 'PRO'}!*\n\nSeu membro FREE *${aluno.nome}* está há *${dias} dias* sem acessar a plataforma.\n\n⚠️ Risco alto de abandono — contato urgente!${linkContato}${linkPainel}`

      await enviarWhatsApp(aluno.gestor_whatsapp!, msgGestor, instanciaGestor)
      notificacoes++
    }
  }

  return NextResponse.json({ ok: true, notificacoes, alunos_verificados: alunos?.length ?? 0 })
  } catch (e: any) {
    await alertarDiscord('critico', 'Cron inatividade falhou', e?.message ?? String(e))
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}
