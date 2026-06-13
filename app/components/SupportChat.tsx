'use client'
import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function SupportChat({ painel, bottomOffset = 24 }: { painel?: string; bottomOffset?: number }) {
 const [aberto, setAberto] = useState(false)
 const [msgs, setMsgs] = useState<Msg[]>([
 { role: 'assistant', content: 'Olá! Sou o suporte da Universidade AVP. Como posso te ajudar?' }
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
 setMsgs(prev => [...prev, { role: 'assistant', content: ` ${msg}` }])
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
 position: 'fixed', bottom: bottomOffset, right: 24, zIndex: 9000,
 width: 52, height: 52, borderRadius: '50%',
 background: '#4f46e5',
 border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 transition: 'transform 0.2s',
 }}
 onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
 onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
>
 {aberto
 ? <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
 : <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
 }
 {pulse && !aberto && (
 <span style={{
 position: 'absolute', top: 0, right: 0,
 width: 14, height: 14, borderRadius: '50%',
 background: '#02A153', border: '2px solid var(--avp-black)',
 }} />
 )}
 </button>

 {/* ── Janela do chat ── */}
 {aberto && (
 <div style={{
 position: 'fixed', bottom: bottomOffset + 64, right: 24, zIndex: 9000,
 width: 340, maxWidth: 'calc(100vw - 48px)',
 background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
 borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
 display: 'flex', flexDirection: 'column',
 maxHeight: '70vh', overflow: 'hidden',
 transition: 'opacity 0.2s ease',
 }}>
 {/* Header */}
 <div style={{
 padding: '14px 16px', background: '#4f46e5',
 display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
 }}>
 <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V3"/><circle cx="12" cy="3" r="1"/><path d="M8 11V7"/><path d="M16 11V7"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>
 </div>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>Suporte AVP</p>
 <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Agente de IA • Resposta imediata</p>
 </div>
 <button onClick={() => setMsgs([{ role: 'assistant', content: 'Olá! Como posso te ajudar?' }])}
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
 background: m.role === 'user' ? '#4f46e5' : 'var(--avp-black)',
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
 <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>digitando...</span>
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
 className="btn btn-primary btn-sm" style={{ fontSize: 16, flexShrink: 0, padding: '8px 14px' }}>
 ↑
 </button>
 </div>
 </div>
 )}

 </>
 )
}
