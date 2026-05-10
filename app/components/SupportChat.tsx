'use client'
import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function SupportChat({ painel }: { painel?: string }) {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! 👋 Sou o suporte da Universidade AVP. Como posso te ajudar?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (aberto) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
      setPulse(false)
    }
  }, [aberto, msgs])

  async function enviar() {
    const texto = input.trim()
    if (!texto || loading) return
    setInput('')

    const novasMsgs: Msg[] = [...msgs, { role: 'user', content: texto }]
    setMsgs(novasMsgs)
    setLoading(true)

    try {
      const res = await fetch('/api/suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: novasMsgs.map(m => ({ role: m.role, content: m.content })),
          painel,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsgs(prev => [...prev, { role: 'assistant', content: data.resposta ?? 'Não consegui processar. Tente novamente.' }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sem conexão. Tente novamente.'
      setMsgs(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── Botão flutuante ── */}
      <button
        onClick={() => setAberto(o => !o)}
        title="Suporte"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9000,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #333687, #02A153)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(51,54,135,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {aberto ? '✕' : '💬'}
        {pulse && !aberto && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 14, height: 14, borderRadius: '50%',
            background: '#02A153', border: '2px solid var(--avp-black)',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>

      {/* ── Janela do chat ── */}
      {aberto && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 9000,
          width: 340, maxWidth: 'calc(100vw - 48px)',
          background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
          borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '70vh', overflow: 'hidden',
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', background: 'linear-gradient(135deg, #333687, #02A153)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>Suporte AVP</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Agente de IA • Resposta imediata</p>
            </div>
            <button onClick={() => setMsgs([{ role: 'assistant', content: 'Olá! 👋 Como posso te ajudar?' }])}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
              Limpar
            </button>
          </div>

          {/* Mensagens */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #333687, #4f46e5)' : 'var(--avp-black)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--avp-border)',
                  color: 'var(--avp-text)', fontSize: 13, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: '12px 12px 12px 4px', padding: '9px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--avp-text-dim)', animation: `bounce 1s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--avp-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviar())}
              placeholder="Descreva seu problema..."
              style={{
                flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
                borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 13,
                outline: 'none', resize: 'none',
              }}
            />
            <button onClick={enviar} disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? 'linear-gradient(135deg, #333687, #02A153)' : 'var(--avp-border)',
                border: 'none', borderRadius: 8, padding: '8px 14px', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                color: '#fff', fontSize: 16, transition: 'all 0.2s', flexShrink: 0,
              }}>
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  )
}
