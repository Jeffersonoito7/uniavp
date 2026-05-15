import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import SuperDashboard from './SuperDashboard'

const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

export default async function SuperPage() {
  const host = headers().get('host')?.replace(/:\d+$/, '') ?? ''
  if (host !== DOMINIO_MASTER && host !== 'localhost') redirect('/login')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/super/login')

  const adminClient = createServiceRoleClient()
  const { data: sa } = await (adminClient.from('super_admins') as any)
    .select('id, nome').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) redirect('/super/login')

  const [
    { data: clientes },
    { count: totalAlunos },
    { count: totalGestores },
    { count: totalAdmins },
    { count: totalModulos },
    { count: totalAulas },
    { data: recentesAlunos },
    { data: configs },
  ] = await Promise.all([
    (adminClient.from('clientes') as any).select('*').order('created_at'),
    (adminClient.from('alunos') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('gestores') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('admins') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('modulos') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('aulas') as any).select('*', { count: 'exact', head: true }),
    (adminClient.from('alunos') as any).select('nome, created_at, status').order('created_at', { ascending: false }).limit(5),
    (adminClient.from('configuracoes') as any).select('chave, valor, descricao').order('chave'),
  ])

  return (
    <SuperDashboard
      nome={sa.nome}
      clientes={clientes ?? []}
      stats={{ totalAlunos: totalAlunos ?? 0, totalGestores: totalGestores ?? 0, totalAdmins: totalAdmins ?? 0, totalModulos: totalModulos ?? 0, totalAulas: totalAulas ?? 0 }}
      recentesAlunos={recentesAlunos ?? []}
      configs={configs ?? []}
    />
  )
}
