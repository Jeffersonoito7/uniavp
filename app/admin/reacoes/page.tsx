import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export default async function ReacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const [
    { data: reacoes },
    { data: aulas },
    { data: alunos },
  ] = await Promise.all([
    (adminClient.from('reacoes_aula') as any).select('*').order('created_at', { ascending: false }),
    (adminClient.from('aulas') as any).select('id, titulo, modulo_id'),
    (adminClient.from('alunos') as any).select('id, nome, whatsapp'),
  ])

  const reacoesData = reacoes ?? []
  const aulasData = aulas ?? []
  const alunosData = alunos ?? []

  const aulaMap: Record<string, string> = {}
  for (const a of aulasData) aulaMap[a.id] = a.titulo

  const alunoMap: Record<string, { nome: string; whatsapp: string }> = {}
  for (const a of alunosData) alunoMap[a.id] = { nome: a.nome, whatsapp: a.whatsapp }

  // Agrupar por aula
  const porAula: Record<string, { titulo: string; notas: number[]; comentarios: { nota: number; comentario: string; aluno: string; data: string }[] }> = {}
  for (const r of reacoesData) {
    if (!porAula[r.aula_id]) {
      porAula[r.aula_id] = { titulo: aulaMap[r.aula_id] || 'Aula desconhecida', notas: [], comentarios: [] }
    }
    porAula[r.aula_id].notas.push(r.nota)
    if (r.comentario) {
      porAula[r.aula_id].comentarios.push({
        nota: r.nota,
        comentario: r.comentario,
        aluno: alunoMap[r.aluno_id]?.nome || 'Desconhecido',
        data: new Date(r.created_at).toLocaleDateString('pt-BR'),
      })
    }
  }

  const media = (notas: number[]) => notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—'
  const estrelas = (nota: number) => '⭐'.repeat(nota)
  const mediaGeral = reacoesData.length ? (reacoesData.reduce((s: number, r: any) => s + r.nota, 0) / reacoesData.length).toFixed(1) : '—'

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Reações das Aulas</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Avaliações e comentários dos consultores por aula</p>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total de Avaliações', valor: reacoesData.length, cor: 'var(--avp-text)' },
          { label: 'Média Geral', valor: `${mediaGeral} ⭐`, cor: '#f59e0b' },
          { label: 'Com Comentário', valor: reacoesData.filter((r: any) => r.comentario).length, cor: 'var(--avp-blue)' },
        ].map(({ label, valor, cor }) => (
          <div key={label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: cor }}>{valor}</p>
          </div>
        ))}
      </div>

      {reacoesData.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
          Nenhuma avaliação registrada ainda.
        </div>
      )}

      {/* Por aula */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(porAula)
          .sort((a, b) => b[1].notas.length - a[1].notas.length)
          .map(([aulaId, dados]) => {
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            dados.notas.forEach(n => dist[n] = (dist[n] || 0) + 1)
            const mediaAula = parseFloat(media(dados.notas))

            return (
              <div key={aulaId} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{dados.titulo}</p>
                    <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>{dados.notas.length} avaliação(ões)</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{media(dados.notas)}</p>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>de 5.0</p>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Distribuição */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 10 }}>DISTRIBUIÇÃO</p>
                    {[5, 4, 3, 2, 1].map(n => {
                      const qty = dist[n] || 0
                      const pct = dados.notas.length > 0 ? Math.round(qty / dados.notas.length * 100) : 0
                      return (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', width: 16 }}>{n}</span>
                          <span style={{ fontSize: 11 }}>⭐</span>
                          <div style={{ flex: 1, background: 'var(--avp-black)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100, background: n >= 4 ? 'var(--avp-green)' : n === 3 ? '#f59e0b' : 'var(--avp-danger)' }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', width: 28 }}>{qty}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Comentários */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 10 }}>COMENTÁRIOS ({dados.comentarios.length})</p>
                    {dados.comentarios.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Sem comentários.</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                      {dados.comentarios.map((c, i) => (
                        <div key={i} style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--avp-text)' }}>{c.aluno}</span>
                            <span style={{ fontSize: 11, color: '#f59e0b' }}>{'⭐'.repeat(c.nota)}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', lineHeight: 1.4 }}>{c.comentario}</p>
                          <p style={{ fontSize: 11, color: 'var(--avp-border)', marginTop: 4 }}>{c.data}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </AdminLayout>
  )
}
