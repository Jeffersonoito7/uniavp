'use client'
import { useState, useEffect, useRef } from 'react'

type Mensagem = { role: 'user' | 'assistant'; content: string }

const SUGESTOES = [
  'Me dá um argumento para cliente que acha caro',
  'Como responder quando o cliente diz que já tem plano?',
  'Script de fechamento para proteção veicular',
  'Quais são os principais diferenciais da associação?',
]

export default function AgenteComercial() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [semCredito, setSemCredito] = useState(false)
  const [nomeAssistente, setNomeAssistente] = useState('Assistente')
  const [erro, setErro] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/agente/saldo')
      .then(r => r.json())
      .then(d => {
        setSaldo(d.saldo ?? 0)
        if (d.nomeAssistente) setNomeAssistente(d.nomeAssistente)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || carregando) return
    if (!texto) setInput('')

    const novas: Mensagem[] = [...mensagens, { role: 'user', content: msg }]
    setMensagens(novas)
    setCarregando(true)
    setErro('')

    try {
      const res = await fetch('/api/gestor/agente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novas.map(m => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()

      if (data.semCredito) {
        setSemCredito(true)
        setMensagens(prev => prev.slice(0, -1))
        setCarregando(false)
        return
      }
      if (data.error) {
        setErro(data.error)
        setCarregando(false)
        return
      }

      setMensagens(prev => [...prev, { role: 'assistant', content: data.resposta }])
      if (data.saldo !== undefined) setSaldo(data.saldo)
      inputRef.current?.focus()
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    }
    setCarregando(false)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  async function verificarSaldo() {
    const d = await fetch('/api/agente/saldo').then(r => r.json()).catch(() => null)
    if (!d) return
    setSaldo(d.saldo ?? 0)
    if ((d.saldo ?? 0) > 0) setSemCredito(false)
  }

  const corSaldo = saldo === null ? 'var(--avp-text-dim)'
    : saldo === 0 ? 'var(--avp-danger)'
    : saldo < 5 ? '#f59e0b'
    : 'var(--avp-green)'

  const inputDesabilitado = carregando || semCredito

  return (
    <>
      <style>{`
        @keyframes avp-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Assistente Comercial</h1>
            <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
              {nomeAssistente} — argumentos, scripts e dicas de fechamento
            </p>
          </div>
          {saldo !== null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Créditos</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: corSaldo, margin: 0, lineHeight: 1 }}>{saldo}</p>
            </div>
          )}
        </div>

        {/* Área de mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 8 }}>

          {/* Estado vazio — boas-vindas e sugestões */}
          {mensagens.length === 0 && (
            <div>
              <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    🤖
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Olá! Sou seu assistente de vendas.</p>
                </div>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>
                  Posso te ajudar com argumentos, como responder objeções, scripts de fechamento e comparações com concorrentes. Como posso ajudar?
                </p>
              </div>

              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sugestões</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SUGESTOES.map(s => (
                  <button key={s} onClick={() => enviar(s)} disabled={inputDesabilitado}
                    style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', cursor: inputDesabilitado ? 'not-allowed' : 'pointer', textAlign: 'left', fontSize: 14, color: 'var(--avp-text)', opacity: inputDesabilitado ? 0.5 : 1 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          {mensagens.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
              {m.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? '#4f46e5' : 'var(--avp-card)',
                border: m.role === 'assistant' ? '1px solid var(--avp-border)' : 'none',
                color: m.role === 'user' ? '#fff' : 'var(--avp-text)',
                fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' as const,
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Digitando */}
          {carregando && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
              <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: '16px 16px 16px 4px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--avp-text-dim)', animation: `avp-bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {erro && (
            <div style={{ background: '#e6394610', border: '1px solid #e6394640', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--avp-danger)' }}>
              {erro}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Aviso sem créditos */}
        {semCredito && (
          <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
            <p style={{ fontSize: 13, color: '#f59e0b', margin: 0, fontWeight: 600 }}>
              Créditos esgotados. Recarregue no Dashboard para continuar.
            </p>
            <button onClick={verificarSaldo}
              style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              Verificar saldo
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--avp-border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Pergunte sobre argumentos, objeções, scripts de venda..."
              rows={2}
              disabled={inputDesabilitado}
              style={{
                flex: 1, resize: 'none' as const, background: 'var(--avp-card)',
                border: '1px solid var(--avp-border)', borderRadius: 12,
                padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
                outline: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                opacity: inputDesabilitado ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || inputDesabilitado}
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
                background: input.trim() && !inputDesabilitado ? '#4f46e5' : 'var(--avp-border)',
                color: '#fff', cursor: input.trim() && !inputDesabilitado ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, transition: 'background 0.15s',
              }}>
              ↑
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', textAlign: 'center', margin: '8px 0 0' }}>
            1 crédito por mensagem · Enter para enviar · Shift+Enter nova linha
          </p>
        </div>
      </div>
    </>
  )
}
