import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from './AdminLayout'
import LiberacoesPendentes from './LiberacoesPendentes'
import LinksTeste from './LinksTeste'

import { DOMINIO_MASTER } from '@/lib/constants'

export default async function AdminDashboard() {
 const host = (await headers()).get('host')?.replace(/:\d+$/, '') ?? ''
 const isMaster = host === DOMINIO_MASTER || host === 'localhost'

 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')
 const tid = adminRecord.tenant_id as string | null
 const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

 const [
 { count: totalAlunos },
 { count: alunosAtivos },
 { count: alunosConcluidos },
 { count: totalModulos },
 { count: totalAulas },
 { count: aulasPublicadas },
 { count: totalGestores },
 { count: gestoresAtivos },
 ] = await Promise.all([
 tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })),
 tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'ativo'),
 tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'concluido'),
 tq(adminClient.from('modulos').select('id', { count: 'exact', head: true })),
 tq(adminClient.from('aulas').select('id', { count: 'exact', head: true })),
 tq(adminClient.from('aulas').select('id', { count: 'exact', head: true })).eq('publicado', true),
 tq(adminClient.from('gestores').select('id', { count: 'exact', head: true })),
 tq(adminClient.from('gestores').select('id', { count: 'exact', head: true })).eq('ativo', true),
 ])

 const taxaConclusao = totalAlunos ? Math.round(((alunosConcluidos ?? 0) / (totalAlunos ?? 1)) * 100) : 0

 const { data: progressoRows } = await tq(adminClient.from('progresso').select('aluno_id').eq('aprovado', true))
 const totalAulasPublicadasN = aulasPublicadas ?? 1
 const progressoPorAluno: Record<string, number> = {}
 for (const p of progressoRows ?? []) {
 progressoPorAluno[p.aluno_id] = (progressoPorAluno[p.aluno_id] ?? 0) + 1
 }
 const vals = Object.values(progressoPorAluno) as number[]
 const mediaProgresso = vals.length> 0
 ? Math.round(vals.reduce((s, v) => s + Math.min(100, Math.round((v / totalAulasPublicadasN) * 100)), 0) / vals.length)
 : 0

 const seteAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
 const { count: novosAlunos } = await tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).gte('created_at', seteAtras)

 const stats = [
 { label: 'Total de Alunos', value: totalAlunos ?? 0, sub: `${alunosAtivos ?? 0} ativos`, cor: '#818cf8' },
 { label: 'Concluíram', value: alunosConcluidos ?? 0, sub: `${taxaConclusao}% de conclusão`, cor: '#4ade80' },
 { label: 'Progresso Médio', value: `${mediaProgresso}%`, sub: 'entre alunos ativos', cor: '#818cf8' },
 { label: 'Novos (7 dias)', value: novosAlunos ?? 0, sub: 'novos cadastros', cor: '#c084fc' },
 { label: 'PROs Ativos', value: gestoresAtivos ?? 0, sub: `de ${totalGestores ?? 0} cadastrados`, cor: '#38bdf8' },
 { label: 'Aulas Publicadas', value: aulasPublicadas ?? 0, sub: `de ${totalAulas ?? 0} criadas`, cor: '#38bdf8' },
 ]

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--avp-text)', letterSpacing: '-0.02em' }}>Dashboard</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>Visão geral da plataforma</p>
 </div>

 {isMaster && <LinksTeste />}

 <LiberacoesPendentes />

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
 {stats.map(s => (
 <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{s.label}</p>
 <p style={{ fontSize: 28, fontWeight: 700, color: s.cor, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.value}</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{s.sub}</p>
 </div>
 ))}
 </div>

 </AdminLayout>
 )
}
