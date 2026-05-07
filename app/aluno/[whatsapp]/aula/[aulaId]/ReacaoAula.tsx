'use client'
import { useState } from 'react'

export default function ReacaoAula({ aulaId, alunoId, jaReagiu }: {
  aulaId: string; alunoId: string; jaReagiu: boolean
}) {
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(jaReagiu)
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!nota) return
    setEnviando(true)
    await fetch('/api/aluno/reacao', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aulaId, alunoId, nota, comentario }),
    })
    setEnviado(true)
    setEnviando(false)
  }

  const labels = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Excelente!']

  if (enviado) {
    return (
      <div style={{ background: '#02A15315', border: '1px solid var(--avp-green)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <p style={{ color: 'var(--avp-green)', fontWeight: 600, fontSize: 14 }}>Obrigado pela sua avaliação!</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Como foi esta aula?</p>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Sua opinião ajuda a melhorar o conteúdo.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setNota(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
              opacity: (hover || nota) >= n ? 1 : 0.3,
              transform: hover === n ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.15s',
            }}
          >⭐</button>
        ))}
      </div>

      {(hover > 0 || nota > 0) && (
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 12, fontWeight: 600 }}>
          {labels[hover || nota]}
        </p>
      )}

      {nota > 0 && (
        <>
          <textarea
            placeholder="Comentário opcional..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            style={{
              width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 13,
              outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          <button
            onClick={enviar}
            disabled={enviando}
            style={{
              background: 'var(--grad-brand)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14,
              cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1,
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </>
      )}
    </div>
  )
}
