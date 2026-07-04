'use client'
import { useState, useEffect } from 'react'

type Pendente = {
  id: string
  percentual: number
  aprovado: boolean
  tentativa_numero: number
  created_at: string
  aluno: { nome: string; whatsapp: string; gestor_nome: string | null }
  aula: { titulo: string; quiz_aprovacao_minima: number; liberacao_modo: string; modulo: { titulo: string } | null }
}

type Aguardando = {
  id: string
  aluno_id: string
  aula_id: string
  proxima_aula_liberada_em: string
  created_at: string
  aluno: { nome: string; whatsapp: string } | null
  aula: { titulo: string; modulo: { titulo: string } | null } | null
}

export default function LiberacoesPendentes() {
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [aguardando, setAguardando] = useState<Aguardando[]>([])
  const [carregado, setCarregado] = useState(false)
  const [liberando, setLiberando] = useState<string | null>(null)
  const [aba, setAba] = useState<'manual' | 'tempo'>('manual')
  const [filtro, setFiltro] = useState<'todos' | 'manual_admin' | 'manual_gestor'>('todos')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/liberar-aula').then(r => r.json()),
      fetch('/api/admin/forcar-liberacao').then(r => r.json()),
    ]).then(([d1, d2]) => {
      setPendentes(d1.pendentes ?? [])
      setAguardando(d2.aguardando ?? [])
      setCarregado(true)
    }).catch(() => setCarregado(true))
  }, [])

  async function liberarManual(progresso_id: string) {
    setLiberando(progresso_id)
    const res = await fetch('/api/admin/liberar-aula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progresso_id, espera_horas: 0 }),
    })
    if (res.ok) setPendentes(prev => prev.filter(p => p.id !== progresso_id))
    setLiberando(null)
  }

  async function forceLiberacao(progresso_id: string) {
    setLiberando(progresso_id)
    const res = await fetch('/api/admin/forcar-liberacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progresso_id }),
    })
    if (res.ok) setAguardando(prev => prev.filter(p => p.id !== progresso_id))
    setLiberando(null)
  }

  if (!carregado) return null

  const totalManual = pendentes.length
  const totalTempo = aguardando.length

  if (totalManual === 0 && totalTempo === 0) return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Nenhuma aula aguardando liberação.</p>
    </div>
  )

  const listaFiltrada = pendentes.filter(p =>
    filtro === 'todos' ? true : p.aula?.liberacao_modo === filtro
  )
  const totalAdmin = pendentes.filter(p => p.aula?.liberacao_modo === 'manual_admin').length
  const totalGestor = pendentes.filter(p => p.aula?.liberacao_modo === 'manual_gestor').length

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
      {/* Abas */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--avp-border)' }}>
        <button onClick={() => setAba('manual')}
          style={{ flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: aba === 'manual' ? 700 : 400, color: aba === 'manual' ? 'var(--avp-text)' : 'var(--avp-text-dim)', borderBottom: aba === 'manual' ? '2px solid var(--avp-blue)' : '2px solid transparent' }}>
          Liberacao manual {totalManual > 0 && <span style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{totalManual}</span>}
        </button>
        <button onClick={() => setAba('tempo')}
          style={{ flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: aba === 'tempo' ? 700 : 400, color: aba === 'tempo' ? 'var(--avp-text)' : 'var(--avp-text-dim)', borderBottom: aba === 'tempo' ? '2px solid #f59e0b' : '2px solid transparent' }}>
          Aguardando tempo {totalTempo > 0 && <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>{totalTempo}</span>}
        </button>
      </div>

      {/* Aba: liberacao manual */}
      {aba === 'manual' && (
        <>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
              {totalManual} aguardando, {totalAdmin} para o admin, {totalGestor} para PROs
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['todos', 'manual_admin', 'manual_gestor'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  style={{ background: filtro === f ? 'var(--avp-blue)' : 'var(--avp-black)', color: filtro === f ? '#fff' : 'var(--avp-text-dim)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: filtro === f ? 700 : 400 }}>
                  {f === 'todos' ? 'Todos' : f === 'manual_admin' ? 'Admin' : 'PRO'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {listaFiltrada.length === 0 ? (
              <div style={{ padding: '20px 24px', color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center' }}>
                Nenhum pendente neste filtro.
              </div>
            ) : listaFiltrada.map((p, idx) => {
              const passou = p.percentual >= (p.aula?.quiz_aprovacao_minima ?? 0)
              const modoLabel = p.aula?.liberacao_modo === 'manual_admin' ? 'Admin' : 'PRO'
              return (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: idx < listaFiltrada.length - 1 ? '1px solid var(--avp-border)' : 'none', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{p.aluno?.nome}</p>
                      <span style={{ fontSize: 10, background: p.aula?.liberacao_modo === 'manual_admin' ? '#6366f120' : '#02A15320', color: p.aula?.liberacao_modo === 'manual_admin' ? '#818cf8' : 'var(--avp-green)', border: `1px solid ${p.aula?.liberacao_modo === 'manual_admin' ? '#6366f140' : '#02A15340'}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                        {modoLabel}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
                      {p.aula?.modulo?.titulo && <span>{p.aula.modulo.titulo} {'>'} </span>}
                      <strong style={{ color: 'var(--avp-text)' }}>{p.aula?.titulo}</strong>
                    </p>
                    {p.aluno?.gestor_nome && (
                      <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Gestor: {p.aluno.gestor_nome}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 100 }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color: passou ? 'var(--avp-green)' : 'var(--avp-danger)', margin: 0 }}>{p.percentual}%</p>
                    <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Min: {p.aula?.quiz_aprovacao_minima ?? 0}%</p>
                    <p style={{ fontSize: 11, color: passou ? 'var(--avp-green)' : 'var(--avp-danger)', fontWeight: 700, margin: '2px 0 0' }}>{passou ? 'Aprovado' : 'Reprovado'}</p>
                    <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{p.tentativa_numero}a tentativa</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                    <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button onClick={() => liberarManual(p.id)} disabled={liberando === p.id}
                    style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0, opacity: liberando === p.id ? 0.7 : 1, minWidth: 100 }}>
                    {liberando === p.id ? '...' : 'Liberar'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Aba: aguardando tempo */}
      {aba === 'tempo' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {aguardando.length === 0 ? (
            <div style={{ padding: '20px 24px', color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center' }}>
              Nenhum aluno aguardando tempo no momento.
            </div>
          ) : aguardando.map((a, idx) => {
            const liberaEm = new Date(a.proxima_aula_liberada_em)
            const agora = new Date()
            const diffMs = liberaEm.getTime() - agora.getTime()
            const diffH = Math.floor(diffMs / 3600000)
            const diffM = Math.floor((diffMs % 3600000) / 60000)
            const tempo = diffH > 0 ? `${diffH}h ${diffM}min` : `${diffM}min`
            return (
              <div key={a.id} style={{ padding: '14px 20px', borderBottom: idx < aguardando.length - 1 ? '1px solid var(--avp-border)' : 'none', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{a.aluno?.nome}</p>
                    <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                      Auto
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
                    {a.aula?.modulo?.titulo && <span>{a.aula.modulo.titulo} {'>'} </span>}
                    <strong style={{ color: 'var(--avp-text)' }}>{a.aula?.titulo}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'center', minWidth: 120 }}>
                  <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, margin: 0 }}>
                    {liberaEm.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} as {liberaEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>falta {tempo}</p>
                </div>
                <button onClick={() => forceLiberacao(a.id)} disabled={liberando === a.id}
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0, opacity: liberando === a.id ? 0.7 : 1, minWidth: 120 }}>
                  {liberando === a.id ? '...' : 'Liberar agora'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
