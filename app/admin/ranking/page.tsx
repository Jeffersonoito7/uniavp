import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: pontos } = await (adminClient.from('aluno_pontos') as any).select('aluno_id, quantidade')
  const totais: Record<string, number> = {}
  for (const p of pontos ?? []) {
    totais[p.aluno_id] = (totais[p.aluno_id] ?? 0) + p.quantidade
  }
  const ranking = Object.entries(totais).sort((a, b) => b[1] - a[1])

  const { data: alunos } = await (adminClient.from('alunos') as any).select('id, nome').in('id', ranking.map(r => r[0]))
  const alunoMap: Record<string, string> = {}
  for (const a of alunos ?? []) alunoMap[a.id] = a.nome

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Ranking</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Alunos com mais pontos na plataforma</p>
      </div>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        {ranking.map(([alunoId, pts], i) => (
          <div key={alunoId} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < ranking.length - 1 ? '1px solid var(--avp-border)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: i < 3 ? '#fff' : 'var(--avp-text-dim)', flexShrink: 0 }}>
              {i + 1}
            </div>
            <p style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{alunoMap[alunoId] ?? 'Aluno'}</p>
            <span style={{ background: 'var(--avp-green)', color: '#fff', borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 14 }}>{pts} pts</span>
          </div>
        ))}
        {ranking.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>Nenhum ponto registrado ainda.</div>}
      </div>
    </AdminLayout>
  )
}
