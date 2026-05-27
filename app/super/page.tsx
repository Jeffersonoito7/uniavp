import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import SuperDashboard from './SuperDashboard'

import { DOMINIO_MASTER } from '@/lib/constants'

export default async function SuperPage() {
  const host = headers().get('host')?.replace(/:\d+$/, '') ?? ''
  if (host !== DOMINIO_MASTER && host !== 'localhost') redirect('/login')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/super/login')

  const adminClient = createServiceRoleClient()
  const { data: sa } = await adminClient.from('super_admins')
    .select('id, nome').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!sa) redirect('/super/login')

  const [
    { data: clientesRaw },
    { count: totalAlunos },
    { count: totalGestores },
    { count: totalAdmins },
    { count: totalModulos },
    { count: totalAulas },
    { data: recentesAlunos },
    { data: configs },
    { data: tenantCfgs },
  ] = await Promise.all([
    adminClient.from('clientes').select('*').order('created_at'),
    adminClient.from('alunos').select('*', { count: 'exact', head: true }),
    adminClient.from('gestores').select('*', { count: 'exact', head: true }),
    adminClient.from('admins').select('*', { count: 'exact', head: true }),
    adminClient.from('modulos').select('*', { count: 'exact', head: true }),
    adminClient.from('aulas').select('*', { count: 'exact', head: true }),
    adminClient.from('alunos').select('nome, created_at, status').order('created_at', { ascending: false }).limit(5),
    adminClient.from('configuracoes').select('chave, valor, descricao').is('tenant_id', null).order('chave'),
    adminClient.from('configuracoes').select('tenant_id, chave, valor').in('chave', ['pro_cobranca_modo', 'plano_pro_valor']),
  ])

  // Mescla configs por tenant nos clientes
  const cfgMap: Record<string, Record<string, string>> = {}
  for (const row of (tenantCfgs ?? [])) {
    if (!row.tenant_id) continue
    if (!cfgMap[row.tenant_id]) cfgMap[row.tenant_id] = {}
    cfgMap[row.tenant_id][row.chave] = String(row.valor ?? '').replace(/"/g, '')
  }
  const clientes = (clientesRaw ?? []).map(c => ({
    ...c,
    pro_modo: cfgMap[c.id]?.['pro_cobranca_modo'] ?? null,
    pro_valor: cfgMap[c.id]?.['plano_pro_valor'] ? parseFloat(cfgMap[c.id]['plano_pro_valor']) : null,
  }))

  return (
    <SuperDashboard
      nome={sa.nome}
      clientes={clientes}
      stats={{ totalAlunos: totalAlunos ?? 0, totalGestores: totalGestores ?? 0, totalAdmins: totalAdmins ?? 0, totalModulos: totalModulos ?? 0, totalAulas: totalAulas ?? 0 }}
      recentesAlunos={recentesAlunos ?? []}
      configs={(configs ?? []).map(c => ({ ...c, valor: c.valor != null ? String(c.valor) : null }))}
    />
  )
}
