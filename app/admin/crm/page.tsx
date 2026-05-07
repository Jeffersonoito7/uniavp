import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const [
    { data: alunos },
    { data: progressoRows },
    { data: aulasPublicadas },
    { data: modulos },
    { data: pontosRows },
  ] = await Promise.all([
    (adminClient.from('alunos') as any).select('id, nome, whatsapp, status, created_at, gestor_nome').order('created_at', { ascending: false }),
    (adminClient.from('progresso') as any).select('aluno_id, aula_id, aprovado').eq('aprovado', true),
    (adminClient.from('aulas') as any).select('id, modulo_id').eq('publicado', true),
    (adminClient.from('modulos') as any).select('id, titulo, ordem').eq('publicado', true).order('ordem'),
    (adminClient.from('aluno_pontos') as any).select('aluno_id, quantidade'),
  ])

  const allAlunos = alunos ?? []
  const totalAulas = (aulasPublicadas ?? []).length

  // mapa aluno_id -> Set de aula_ids concluídas
  const progressoMap: Record<string, Set<string>> = {}
  for (const p of progressoRows ?? []) {
    if (!progressoMap[p.aluno_id]) progressoMap[p.aluno_id] = new Set()
    progressoMap[p.aluno_id].add(p.aula_id)
  }

  // mapa aula_id -> modulo_id
  const aulasModuloMap: Record<string, string> = {}
  for (const a of aulasPublicadas ?? []) aulasModuloMap[a.id] = a.modulo_id

  // mapa modulo_id -> {titulo, ordem}
  const moduloMap: Record<string, { titulo: string; ordem: number }> = {}
  for (const m of modulos ?? []) moduloMap[m.id] = { titulo: m.titulo, ordem: m.ordem }

  // mapa aluno_id -> pontos totais
  const pontosMap: Record<string, number> = {}
  for (const p of pontosRows ?? []) {
    pontosMap[p.aluno_id] = (pontosMap[p.aluno_id] || 0) + p.quantidade
  }

  // Métricas por aluno
  const nuncaIniciou = allAlunos.filter((a: any) => !progressoMap[a.id] || progressoMap[a.id].size === 0).length
  const formados = allAlunos.filter((a: any) => totalAulas > 0 && (progressoMap[a.id]?.size ?? 0) >= totalAulas).length
  const emAndamento = allAlunos.length - nuncaIniciou - formados

  // Por status
  const porStatus = allAlunos.reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1; return acc
  }, {})

  // Módulo atual de cada aluno (último módulo com progresso)
  function moduloAtualAluno(alunoId: string): string {
    const aulasAluno = Array.from(progressoMap[alunoId] ?? [])
    if (aulasAluno.length === 0) return '—'
    const modulosAluno = [...new Set(aulasAluno.map(id => aulasModuloMap[id]).filter(Boolean))]
    modulosAluno.sort((a, b) => (moduloMap[b]?.ordem ?? 0) - (moduloMap[a]?.ordem ?? 0))
    return moduloMap[modulosAluno[0]]?.titulo || '—'
  }

  // Distribuição por módulo
  const distModulo: Record<string, number> = {}
  for (const a of allAlunos) {
    const m = moduloAtualAluno(a.id)
    if (m !== '—') distModulo[m] = (distModulo[m] || 0) + 1
  }

  // Cadastros por mês (últimos 6 meses)
  const meses: Record<string, number> = {}
  const hoje = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje); d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses[key] = 0
  }
  for (const a of allAlunos) {
    const d = new Date(a.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (key in meses) meses[key]++
  }

  const card = (titulo: string, valor: number | string, cor: string) => (
    <div key={titulo} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{titulo}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: cor }}>{valor}</p>
    </div>
  )

  const statusLabel: Record<string, string> = { ativo: 'Ativo', concluido: 'Concluído', pausado: 'Pausado', desligado: 'Desligado' }
  const statusCor: Record<string, string> = { ativo: 'var(--avp-green)', concluido: 'var(--avp-blue)', pausado: '#f59e0b', desligado: 'var(--avp-danger)' }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>CRM — Visão Geral</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Acompanhe o progresso e engajamento dos consultores</p>
      </div>

      {/* Cards principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {card('Total de Consultores', allAlunos.length, 'var(--avp-text)')}
        {card('Nunca Iniciaram', nuncaIniciou, 'var(--avp-text-dim)')}
        {card('Em Andamento', emAndamento, '#f59e0b')}
        {card('Formados', formados, 'var(--avp-green)')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Por status */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Por Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['ativo', 'concluido', 'pausado', 'desligado'].map(s => {
              const qty = porStatus[s] || 0
              const pct = allAlunos.length > 0 ? Math.round(qty / allAlunos.length * 100) : 0
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: statusCor[s] }}>{statusLabel[s]}</span>
                    <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>{qty} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'var(--avp-black)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: statusCor[s], height: '100%', borderRadius: 100 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Por módulo */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Consultores por Módulo Atual</p>
          {Object.entries(distModulo).length === 0 && (
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Nenhum progresso registrado ainda.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(distModulo).sort((a, b) => b[1] - a[1]).map(([mod, qty]) => {
              const pct = allAlunos.length > 0 ? Math.round(qty / allAlunos.length * 100) : 0
              return (
                <div key={mod}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--avp-text)' }}>{mod}</span>
                    <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{qty}</span>
                  </div>
                  <div style={{ background: 'var(--avp-black)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: 'var(--grad-brand)', height: '100%', borderRadius: 100 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cadastros por mês */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Cadastros por Mês</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {Object.entries(meses).map(([key, qty]) => {
            const max = Math.max(...Object.values(meses), 1)
            const pct = Math.round(qty / max * 100)
            const [ano, mes] = key.split('-')
            const nomeMes = new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short' })
            return (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>{qty}</span>
                <div style={{ width: '100%', height: `${pct}%`, minHeight: 4, background: 'var(--grad-brand)', borderRadius: 6, transition: 'height 0.4s' }} />
                <span style={{ fontSize: 11, color: 'var(--avp-text-dim)', textTransform: 'capitalize' }}>{nomeMes}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela de consultores */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--avp-border)' }}>
          <p style={{ fontWeight: 700, fontSize: 15 }}>Consultores — Detalhado</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--avp-black)' }}>
                {['Nome', 'WhatsApp', 'Gestor', 'Módulo Atual', 'Aulas', 'Pontos', 'Status', 'Cadastro'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAlunos.map(a => {
                const concluidas = progressoMap[a.id]?.size ?? 0
                const pct = totalAulas > 0 ? Math.round(concluidas / totalAulas * 100) : 0
                const pontos = pontosMap[a.id] ?? 0
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--avp-border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{a.nome}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--avp-text-dim)' }}>{a.whatsapp}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--avp-text-dim)' }}>{a.gestor_nome || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>{moduloAtualAluno(a.id)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, background: 'var(--avp-black)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, background: 'var(--grad-brand)', height: '100%', borderRadius: 100 }} />
                        </div>
                        <span style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>{concluidas}/{totalAulas}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--avp-blue)' }}>{pontos}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: (statusCor[a.status] || 'var(--avp-text-dim)') + '20', color: statusCor[a.status] || 'var(--avp-text-dim)', borderRadius: 20, padding: '2px 10px', fontWeight: 600, fontSize: 11 }}>
                        {statusLabel[a.status] || a.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--avp-text-dim)' }}>
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
