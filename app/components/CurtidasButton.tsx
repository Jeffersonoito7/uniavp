'use client'
import { useState } from 'react'

export default function CurtidasButton({ aulaId, alunoId, inicialCurtido, inicialTotal }: {
  aulaId: string; alunoId: string; inicialCurtido: boolean; inicialTotal: number
}) {
  const [curtido, setCurtido] = useState(inicialCurtido)
  const [total, setTotal] = useState(inicialTotal)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    const res = await fetch('/api/aluno/curtidas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aulaId, alunoId }),
    })
    const data = await res.json()
    setCurtido(data.curtido)
    setTotal(data.total)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: curtido ? '#e6394620' : 'var(--avp-card)',
        border: `1px solid ${curtido ? 'var(--avp-danger)' : 'var(--avp-border)'}`,
        borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
        color: curtido ? 'var(--avp-danger)' : 'var(--avp-text-dim)',
        fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
      }}
    >
      {curtido ? '❤️' : '🤍'} {total} {total === 1 ? 'curtida' : 'curtidas'}
    </button>
  )
}
