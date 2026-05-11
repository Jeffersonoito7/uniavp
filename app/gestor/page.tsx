import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import GestorDashboard from './GestorDashboard'

export default async function GestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/gestor/login')

  const adminClient = createServiceRoleClient()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome, email, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) redirect('/gestor/login')

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

  return (
    <GestorDashboard
      gestor={gestor}
      consultores={consultores ?? []}
      progressoMap={progressoMap}
    />
  )
}
