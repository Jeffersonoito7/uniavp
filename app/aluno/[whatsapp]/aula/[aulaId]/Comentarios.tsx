'use client'
import { useState, useEffect } from 'react'

type Comentario = {
  id: string
  texto: string
  created_at: string
  parent_id: string | null
  aluno: { nome: string } | null
  respostas?: Comentario[]
}

export default function Comentarios({ aulaId, alunoId, alunoNome }: { aulaId: string; alunoId: string; alunoNome: string }) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondendoId, setRespondendoId] = useState<string | null>(null)
  const [textoResposta, setTextoResposta] = useState('')

  useEffect(() => {
    fetch(`/api/comentarios?aula_id=${aulaId}`)
      .then(r => r.json())
      .then(d => setComentarios(d.comentarios ?? []))
  }, [aulaId])

  async function enviarComentario(parentId: string | null = null) {
    const t = parentId ? textoResposta : texto
    if (!t.trim()) return
    setEnviando(true)
    const res = await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aula_id: aulaId, texto: t, parent_id: parentId }),
    })
    const data = await res.json()
    if (data.comentario) {
      if (parentId) {
        setComentarios(cs => cs.map(c => c.id === parentId ? { ...c, respostas: [...(c.respostas ?? []), data.comentario] } : c))
        setRespondendoId(null)
        setTextoResposta('')
      } else {
        setComentarios(cs => [{ ...data.comentario, respostas: [] }, ...cs])
        setTexto('')
      }
    }
    setEnviando(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'Inter, sans-serif' }
  const btnStyle: React.CSSProperties = { background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }

  function ComentarioItem({ c, indent = false }: { c: Comentario; indent?: boolean }) {
    return (
      <div style={{ paddingLeft: indent ? 32 : 0 }}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{c.aluno?.nome ?? 'Aluno'}</span>
            <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <p style={{ color: 'var(--avp-text)', fontSize: 14, lineHeight: 1.5 }}>{c.texto}</p>
          {!indent && (
            <button onClick={() => setRespondendoId(respondendoId === c.id ? null : c.id)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 12, marginTop: 8, padding: 0 }}>
              Responder
            </button>
          )}
        </div>
        {!indent && respondendoId === c.id && (
          <div style={{ paddingLeft: 32, marginBottom: 12 }}>
            <textarea style={inputStyle} value={textoResposta} onChange={e => setTextoResposta(e.target.value)} placeholder="Sua resposta..." />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => enviarComentario(c.id)} disabled={enviando} style={btnStyle}>Enviar</button>
              <button onClick={() => { setRespondendoId(null); setTextoResposta('') }} style={{ ...btnStyle, background: 'var(--avp-border)' }}>Cancelar</button>
            </div>
          </div>
        )}
        {(c.respostas ?? []).map(r => <ComentarioItem key={r.id} c={r} indent />)}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--avp-text)' }}>Comentários ({comentarios.length})</h3>
      <div style={{ marginBottom: 20 }}>
        <textarea style={inputStyle} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Deixe seu comentário..." />
        <button onClick={() => enviarComentario(null)} disabled={enviando || !texto.trim()} style={{ ...btnStyle, marginTop: 10 }}>
          {enviando ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {comentarios.filter(c => !c.parent_id).map(c => <ComentarioItem key={c.id} c={c} />)}
        {comentarios.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Seja o primeiro a comentar!</p>}
      </div>
    </div>
  )
}
