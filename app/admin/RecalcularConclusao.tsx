'use client'
import { useState } from 'react'

export default function RecalcularConclusao() {
  const [rodando, setRodando] = useState(false)
  const [resultado, setResultado] = useState<{ atualizados: number; total: number; msg?: string } | null>(null)
  const [erro, setErro] = useState('')

  async function recalcular() {
    setRodando(true)
    setResultado(null)
    setErro('')
    try {
      const r = await fetch('/api/admin/recalcular-conclusao', { method: 'POST' })
      const d = await r.json()
      if (d.ok) setResultado(d)
      else setErro(d.error ?? 'Erro ao recalcular.')
    } catch {
      setErro('Erro de rede.')
    }
    setRodando(false)
  }

  if (resultado) return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
      <span style={{ color: '#4ade80', fontWeight: 600 }}>
        Recalculo concluido: {resultado.atualizados} aluno(s) atualizados para "concluido" de {resultado.total} verificados.
      </span>
    </div>
  )

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--avp-text)', margin: 0 }}>Recalcular conclusoes</p>
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
          Verifica alunos que completaram todas as aulas mas nao foram marcados como concluidos.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {erro && <span style={{ fontSize: 12, color: '#f87171' }}>{erro}</span>}
        <button
          onClick={recalcular}
          disabled={rodando}
          style={{ background: 'var(--avp-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: rodando ? 'not-allowed' : 'pointer', opacity: rodando ? 0.7 : 1 }}
        >
          {rodando ? 'Calculando...' : 'Recalcular'}
        </button>
      </div>
    </div>
  )
}
