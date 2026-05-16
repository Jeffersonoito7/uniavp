import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from './AdminLayout'
import LinksCaptacao from './LinksCapatacao'
import LiberacoesPendentes from './LiberacoesPendentes'
import LinksTeste from './LinksTeste'

const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

export default async function AdminDashboard() {
  const host = (await headers()).get('host')?.replace(/:\d+$/, '') ?? ''
  const isMaster = host === DOMINIO_MASTER || host === 'localhost'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

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
    (adminClient.from('alunos') as any).select('id', { count: 'exact', head: true }),
    (adminClient.from('alunos') as any).select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    (adminClient.from('alunos') as any).select('id', { count: 'exact', head: true }).eq('status', 'concluido'),
    (adminClient.from('modulos') as any).select('id', { count: 'exact', head: true }),
    (adminClient.from('aulas') as any).select('id', { count: 'exact', head: true }),
    (adminClient.from('aulas') as any).select('id', { count: 'exact', head: true }).eq('publicado', true),
    (adminClient.from('gestores') as any).select('id', { count: 'exact', head: true }),
    (adminClient.from('gestores') as any).select('id', { count: 'exact', head: true }).eq('ativo', true),
  ])

  // Taxa de conclusão
  const taxaConclusao = totalAlunos ? Math.round(((alunosConcluidos ?? 0) / (totalAlunos ?? 1)) * 100) : 0

  // Progresso médio (alunos ativos)
  const { data: progressoRows } = await (adminClient.from('progresso') as any)
    .select('aluno_id').eq('aprovado', true)
  const totalAulasPublicadasN = aulasPublicadas ?? 1
  const progressoPorAluno: Record<string, number> = {}
  for (const p of progressoRows ?? []) {
    progressoPorAluno[p.aluno_id] = (progressoPorAluno[p.aluno_id] ?? 0) + 1
  }
  const vals = Object.values(progressoPorAluno) as number[]
  const mediaProgresso = vals.length > 0
    ? Math.round(vals.reduce((s, v) => s + Math.min(100, Math.round((v / totalAulasPublicadasN) * 100)), 0) / vals.length)
    : 0

  // Novos cadastros nos últimos 7 dias
  const seteAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: novosAlunos } = await (adminClient.from('alunos') as any)
    .select('id', { count: 'exact', head: true })
    .gte('created_at', seteAtras)

  const stats = [
    { label: 'Total de Alunos', value: totalAlunos ?? 0, sub: `${alunosAtivos ?? 0} ativos`, cor: '#3b82f6', icon: '👥' },
    { label: 'Concluíram', value: alunosConcluidos ?? 0, sub: `${taxaConclusao}% de conclusão`, cor: '#22c55e', icon: '🎓' },
    { label: 'Progresso Médio', value: `${mediaProgresso}%`, sub: 'entre alunos ativos', cor: '#f59e0b', icon: '📈' },
    { label: 'Novos (7 dias)', value: novosAlunos ?? 0, sub: 'novos cadastros', cor: '#8b5cf6', icon: '✨' },
    { label: 'PROs Ativos', value: gestoresAtivos ?? 0, sub: `de ${totalGestores ?? 0} cadastrados`, cor: '#06b6d4', icon: '✨' },
    { label: 'Aulas Publicadas', value: aulasPublicadas ?? 0, sub: `de ${totalAulas ?? 0} criadas`, cor: '#f97316', icon: '🎬' },
  ]

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Visão geral da plataforma</p>
      </div>

      {isMaster && <LinksTeste />}

      {/* Atalho para os links de captação */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>🔗 Links de Captação UNIAVP FREE</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Funil completo e acesso direto — com QR code e compartilhamento por WhatsApp</p>
        </div>
        <a href="/admin/captacao"
          style={{ flexShrink: 0, background: 'var(--avp-blue)', color: '#fff', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Ver links →
        </a>
      </div>

      <LiberacoesPendentes />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</p>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, color: s.cor, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <LinksCaptacao />
    </AdminLayout>
  )
}
