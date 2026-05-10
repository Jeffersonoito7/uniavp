import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import GestorDashboard from './GestorDashboard'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'

export default async function GestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?from=gestor')

  const adminClient = createServiceRoleClient()

  const { data: gestor } = await (adminClient.from('gestores') as any)
    .select('id, nome, email, whatsapp')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!gestor) redirect('/login')

  const { data: consultores } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at')
    .eq('gestor_whatsapp', gestor.whatsapp)
    .order('created_at', { ascending: false })

  const { count: totalAulas } = await (adminClient.from('aulas') as any)
    .select('*', { count: 'exact', head: true })
    .eq('publicado', true)

  const progressoMap: Record<string, number> = {}
  for (const c of (consultores ?? [])) {
    const { data: prog } = await (adminClient.from('progresso') as any)
      .select('aula_id')
      .eq('aluno_id', c.id)
      .eq('aprovado', true)
    const uniqueAulas = new Set((prog ?? []).map((p: any) => p.aula_id)).size
    progressoMap[c.id] = totalAulas ? Math.round((uniqueAulas / totalAulas) * 100) : 0
  }

  return (
    <GestorDashboard
      gestor={gestor}
      consultores={consultores ?? []}
      progressoMap={progressoMap}
      whatsappWidget={<WhatsAppConectar />}
    />
  )
}
