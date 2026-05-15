import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import GestorDashboard from './GestorDashboard'

export default async function GestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/gestor/login')

  const adminClient = createServiceRoleClient()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome, email, whatsapp, foto_perfil, status_assinatura, trial_expira_em, plano_vencimento')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) redirect('/gestor/login')

  // Se trial sem data de expiração → auto-concede 7 dias (bug da migration DEFAULT)
  if (gestor.status_assinatura === 'trial' && !gestor.trial_expira_em) {
    const trialExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await (adminClient.from('gestores') as any)
      .update({ trial_expira_em: trialExpira })
      .eq('id', gestor.id)
    gestor.trial_expira_em = trialExpira
  }

  // Verifica acesso: trial ativo, plano ativo, ou plano ativo sem data (legado)
  const agora = new Date()
  const trialAtivo = gestor.status_assinatura === 'trial' && gestor.trial_expira_em && new Date(gestor.trial_expira_em) > agora
  const planoAtivo = gestor.status_assinatura === 'ativo' && (!gestor.plano_vencimento || new Date(gestor.plano_vencimento) > agora)
  if (!trialAtivo && !planoAtivo) redirect('/gestor/assinar')

  const gestorFoto: string | null = gestor.foto_perfil ?? null

  const { data: consultores } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at')
    .eq('gestor_whatsapp', gestor.whatsapp)
    .order('created_at', { ascending: false })

  const { count: totalAulas } = await (adminClient.from('aulas') as any)
    .select('*', { count: 'exact', head: true })
    .eq('publicado', true)

  const progressoMap: Record<string, number> = {}
  if ((consultores ?? []).length > 0) {
    const alunoIds = (consultores ?? []).map((c: any) => c.id)
    const { data: todosProgresso } = await (adminClient.from('progresso') as any)
      .select('aluno_id, aula_id')
      .in('aluno_id', alunoIds)
      .eq('aprovado', true)
    const contagem: Record<string, Set<string>> = {}
    for (const p of (todosProgresso ?? [])) {
      if (!contagem[p.aluno_id]) contagem[p.aluno_id] = new Set()
      contagem[p.aluno_id].add(p.aula_id)
    }
    for (const c of (consultores ?? [])) {
      const unique = contagem[c.id]?.size ?? 0
      progressoMap[c.id] = totalAulas ? Math.round((unique / totalAulas) * 100) : 0
    }
  }

  const { data: templatesRaw } = await (adminClient.from('artes_templates') as any)
    .select('*').order('created_at')
  const artesTemplates = (templatesRaw ?? []).filter((t: any) => !t.gestor_id || t.gestor_id === gestor.id)

  const siteConfig = await getSiteConfig()
  const baseUrl = siteConfig.dominioCustomizado
    ? `https://${siteConfig.dominioCustomizado}`
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br')

  const { data: capaCfg } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'modulo_capa_padrao').maybeSingle()
  const capaDefault = capaCfg?.valor ? String(capaCfg.valor).replace(/"/g, '') : null

  return (
    <GestorDashboard
      gestor={{ ...gestor, foto_perfil: gestorFoto }}
      consultores={consultores ?? []}
      progressoMap={progressoMap}
      artesTemplatesIniciais={artesTemplates}
      baseUrl={baseUrl}
      capaDefault={capaDefault}
    />
  )
}
