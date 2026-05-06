'use client'
import { useState } from 'react'

type Resposta = {
  id: string
  texto: string
  created_at: string
  aluno: { nome: string } | null
}

export default function TopicoCliente({ topicoId, respostasIniciais }: { topicoId: string; respostasIniciais: Resposta[] }) {
  const [respostas, setRespostas] = useState<Resposta[]>(respostasIniciais)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    const res = await fetch('/api/forum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'resposta', topico_id: topicoId, texto }),
    })
    const data = await res.json()
    if (data.resposta) {
      setRespostas(r => [...r, data.resposta])
      setTexto('')
    }
    setEnviando(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 90, fontFamily: 'Inter, sans-serif' }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--avp-text-dim)' }}>
        {respostas.length} resposta{respostas.length !== 1 ? 's' : ''}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {respostas.map(r => (
          <div key={r.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{r.aluno?.nome ?? 'Aluno'}</span>
              <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <p style={{ color: 'var(--avp-text)', fontSize: 14, lineHeight: 1.6 }}>{r.texto}</p>
          </div>
        ))}
        {respostas.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhuma resposta ainda. Seja o primeiro!</p>}
      </div>

      <form onSubmit={enviarResposta} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15 }}>Sua resposta</h3>
        <textarea style={inputStyle} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva sua resposta..." required />
        <button type="submit" disabled={enviando || !texto.trim()} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: (!texto.trim() || enviando) ? 0.5 : 1 }}>
          {enviando ? 'Enviando...' : 'Responder'}
        </button>
      </form>
    </div>
  )
}
