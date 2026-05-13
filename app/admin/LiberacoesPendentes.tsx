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

export default function LiberacoesPendentes() {
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [carregado, setCarregado] = useState(false)
  const [liberando, setLiberando] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'manual_admin' | 'manual_gestor'>('todos')

  useEffect(() => {
    fetch('/api/admin/liberar-aula')
      .then(r => r.json())
      .then(d => { setPendentes(d.pendentes ?? []); setCarregado(true) })
      .catch(() => setCarregado(true))
  }, [])

  async function liberar(progresso_id: string) {
    setLiberando(progresso_id)
    const res = await fetch('/api/admin/liberar-aula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progresso_id, espera_horas: 0 }),
    })
    if (res.ok) setPendentes(prev => prev.filter(p => p.id !== progresso_id))
    setLiberando(null)
  }

  if (!carregado) return null

  const lista = pendentes.filter(p =>
    filtro === 'todos' ? true : p.aula?.liberacao_modo === filtro
  )

  const totalAdmin = pendentes.filter(p => p.aula?.liberacao_modo === 'manual_admin').length
  const totalGestor = pendentes.filter(p => p.aula?.liberacao_modo === 'manual_gestor').length

  if (pendentes.length === 0) return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 22 }}>✅</span>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Nenhuma aula aguardando liberação manual.</p>
    </div>
  )

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Liberações pendentes</p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
              {pendentes.length} aguardando · {totalAdmin} para o admin · {totalGestor} para gestores
            </p>
          </div>
        </div>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todos', 'manual_admin', 'manual_gestor'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ background: filtro === f ? 'var(--avp-blue)' : 'var(--avp-black)', color: filtro === f ? '#fff' : 'var(--avp-text-dim)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: filtro === f ? 700 : 400 }}>
              {f === 'todos' ? 'Todos' : f === 'manual_admin' ? '🛡 Admin' : '👤 Gestor'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {lista.length === 0 ? (
          <div style={{ padding: '20px 24px', color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center' }}>
            Nenhum pendente neste filtro.
          </div>
        ) : lista.map((p, idx) => {
          const passou = p.percentual >= (p.aula?.quiz_aprovacao_minima ?? 0)
          const modoLabel = p.aula?.liberacao_modo === 'manual_admin' ? '🛡 Admin' : '👤 Gestor'
          return (
            <div key={p.id} style={{ padding: '14px 20px', borderBottom: idx < lista.length - 1 ? '1px solid var(--avp-border)' : 'none', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Aluno */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{p.aluno?.nome}</p>
                  <span style={{ fontSize: 10, background: p.aula?.liberacao_modo === 'manual_admin' ? '#6366f120' : '#02A15320', color: p.aula?.liberacao_modo === 'manual_admin' ? '#818cf8' : 'var(--avp-green)', border: `1px solid ${p.aula?.liberacao_modo === 'manual_admin' ? '#6366f140' : '#02A15340'}`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                    {modoLabel}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
                  {p.aula?.modulo?.titulo && <span>{p.aula.modulo.titulo} → </span>}
                  <strong style={{ color: 'var(--avp-text)' }}>{p.aula?.titulo}</strong>
                </p>
                {p.aluno?.gestor_nome && (
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Gestor: {p.aluno.gestor_nome}</p>
                )}
              </div>

              {/* Resultado do quiz */}
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: passou ? 'var(--avp-green)' : 'var(--avp-danger)', margin: 0 }}>
                  {p.percentual}%
                </p>
                <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                  Mínimo: {p.aula?.quiz_aprovacao_minima ?? 0}%
                </p>
                <p style={{ fontSize: 11, color: passou ? 'var(--avp-green)' : 'var(--avp-danger)', fontWeight: 700, margin: '2px 0 0' }}>
                  {passou ? '✓ Aprovado' : '✗ Reprovado'}
                </p>
                <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                  {p.tentativa_numero}ª tentativa
                </p>
              </div>

              {/* Data */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p style={{ fontSize: 10, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                  {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Ação */}
              <button
                onClick={() => liberar(p.id)}
                disabled={liberando === p.id}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0, opacity: liberando === p.id ? 0.7 : 1, minWidth: 100 }}
              >
                {liberando === p.id ? '...' : '✅ Liberar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
