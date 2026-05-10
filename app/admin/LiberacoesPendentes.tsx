'use client'
import { useState, useEffect } from 'react'

type Pendente = {
  id: string
  percentual: number
  created_at: string
  aluno: { nome: string; whatsapp: string }
  aula: { titulo: string; quiz_aprovacao_minima: number; liberacao_modo: string }
}

export default function LiberacoesPendentes() {
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [carregado, setCarregado] = useState(false)
  const [liberando, setLiberando] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/liberar-aula')
      .then(r => r.json())
      .then(d => { setPendentes(d.pendentes ?? []); setCarregado(true) })
      .catch(() => setCarregado(true))
  }, [])

  async function liberar(progresso_id: string) {
    setLiberando(progresso_id)
    await fetch('/api/admin/liberar-aula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progresso_id, espera_horas: 0 }),
    })
    setPendentes(prev => prev.filter(p => p.id !== progresso_id))
    setLiberando(null)
  }

  if (!carregado || pendentes.length === 0) return null

  // Filtra só os que precisam do admin
  const paraAdmin = pendentes.filter(p => p.aula?.liberacao_modo === 'manual_admin')
  if (paraAdmin.length === 0) return null

  return (
    <div style={{ background: '#e6394610', border: '1px solid #e6394640', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🛡</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--avp-danger)' }}>Liberações pendentes (Admin)</p>
          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>{paraAdmin.length} consultor{paraAdmin.length !== 1 ? 'es' : ''} aguardando aprovação do admin.</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paraAdmin.map(p => (
          <div key={p.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{p.aluno?.nome}</p>
              <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Concluiu: <strong style={{ color: 'var(--avp-text)' }}>{p.aula?.titulo}</strong></p>
              <p style={{ fontSize: 12, color: 'var(--avp-green)', marginTop: 2 }}>✓ {p.percentual}% de acerto</p>
            </div>
            <button onClick={() => liberar(p.id)} disabled={liberando === p.id}
              style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0, opacity: liberando === p.id ? 0.7 : 1 }}>
              {liberando === p.id ? 'Liberando...' : '✅ Liberar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
