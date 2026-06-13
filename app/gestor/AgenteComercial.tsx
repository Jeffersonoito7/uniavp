'use client'
import { useState, useEffect, useRef } from 'react'

type Mensagem = { role: 'user' | 'assistant'; content: string; temAnexo?: boolean }
type Anexo = { data: string; type: string; name: string; previewUrl?: string }

const SUGESTOES = [
 'Me dá um argumento para cliente que acha caro',
 'Como responder quando o cliente diz que já tem plano?',
 'Script de fechamento para proteção veicular',
 'Quais são os principais diferenciais da associação?',
]

const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'
const TAMANHO_MAX_MB = 3

function IconePaperclip() {
 return (
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
 </svg>
 )
}

export default function AgenteComercial() {
 const [mensagens, setMensagens] = useState<Mensagem[]>([])
 const [input, setInput] = useState('')
 const [carregando, setCarregando] = useState(false)
 const [saldo, setSaldo] = useState<number | null>(null)
 const [semCredito, setSemCredito] = useState(false)
 const [nomeAssistente, setNomeAssistente] = useState('Assistente')
 const [erro, setErro] = useState('')
 const [anexo, setAnexo] = useState<Anexo | null>(null)
 const bottomRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLTextAreaElement>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)

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

 function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
 const file = e.target.files?.[0]
 if (!file) return
 e.target.value = ''

 if (file.size> TAMANHO_MAX_MB * 1024 * 1024) {
 setErro(`Arquivo muito grande. Máximo ${TAMANHO_MAX_MB}MB.`)
 return
 }

 const reader = new FileReader()
 reader.onload = ev => {
 const dataUrl = ev.target?.result as string
 // Remove o prefixo "data:tipo;base64," e fica só o base64 puro
 const base64 = dataUrl.split(',')[1]
 setAnexo({
 data: base64,
 type: file.type,
 name: file.name,
 previewUrl: file.type.startsWith('image/') ? dataUrl : undefined,
 })
 }
 reader.readAsDataURL(file)
 }

 async function enviar(texto?: string) {
 const msg = (texto ?? input).trim()
 if ((!msg && !anexo) || carregando) return
 if (!texto) setInput('')

 const textoFinal = msg || (anexo ? 'Analise este arquivo e sugira como usar isso para vender.' : '')
 const novas: Mensagem[] = [...mensagens, { role: 'user', content: textoFinal, temAnexo: !!anexo }]
 setMensagens(novas)
 const anexoEnviado = anexo
 setAnexo(null)
 setCarregando(true)
 setErro('')

 try {
 const body: Record<string, unknown> = {
 messages: novas.map(m => ({ role: m.role, content: m.content })),
 }
 if (anexoEnviado) {
 body.attachment = { data: anexoEnviado.data, type: anexoEnviado.type, name: anexoEnviado.name }
 }

 const res = await fetch('/api/gestor/agente/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
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
 if ((d.saldo ?? 0)> 0) setSemCredito(false)
 }

 const corSaldo = saldo === null ? 'var(--avp-text-dim)'
 : saldo === 0 ? 'var(--avp-danger)'
 : saldo < 5 ? '#f59e0b'
 : 'var(--avp-green)'

 const inputDesabilitado = carregando || semCredito
 const custoPorMsg = anexo ? (anexo.type === 'application/pdf' ? 3 : 2) : 1
 const podeCancelarAnexo = !carregando

 return (
 <>
 <style>{`
 @keyframes avp-bounce {
 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
 30% { transform: translateY(-5px); opacity: 1; }
 }
 `}</style>

 <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100svh - 200px)', maxWidth: 780, margin: '0 auto' }}>

 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
 <div>
 <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Assistente Comercial</h1>
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
 {nomeAssistente} — argumentos, scripts e análise de cotações
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

 {mensagens.length === 0 && (
 <div>
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
 <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
 
 </div>
 <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Olá! Sou seu assistente de vendas.</p>
 </div>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0, lineHeight: 1.65 }}>
 Posso ajudar com argumentos, objeções e scripts. Você também pode <strong style={{ color: 'var(--avp-text)' }}>anexar uma foto ou PDF de cotação do concorrente</strong> e eu faço a comparação para você fechar a venda.
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

 {mensagens.map((m, i) => (
 <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
 {m.role === 'assistant' && (
 <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
 
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
 {m.temAnexo && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: m.content ? 8 : 0, opacity: 0.8, fontSize: 12 }}>
 <IconePaperclip />
 <span>Arquivo anexado</span>
 </div>
 )}
 {m.content}
 </div>
 </div>
 ))}

 {carregando && (
 <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
 <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}></div>
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

 {/* Área de input */}
 <div style={{ flexShrink: 0, borderTop: '1px solid var(--avp-border)', paddingTop: 12 }}>

 {/* Preview do anexo */}
 {anexo && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
 {anexo.previewUrl ? (
 <img src={anexo.previewUrl} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
 ) : (
 <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
 
 </div>
 )}
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{anexo.name}</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
 {custoPorMsg} crédito{custoPorMsg> 1 ? 's' : ''} · {anexo.type === 'application/pdf' ? 'PDF' : 'Imagem'}
 </p>
 </div>
 {podeCancelarAnexo && (
 <button onClick={() => setAnexo(null)}
 style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>
 ×
 </button>
 )}
 </div>
 )}

 <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
 {/* Botão anexar */}
 <button
 onClick={() => fileInputRef.current?.click()}
 disabled={inputDesabilitado}
 title="Anexar imagem ou PDF"
 style={{
 width: 44, height: 44, borderRadius: 12, border: '1px solid var(--avp-border)',
 background: anexo ? 'rgba(79,70,229,0.15)' : 'var(--avp-card)',
 color: anexo ? '#818cf8' : 'var(--avp-text-dim)',
 cursor: inputDesabilitado ? 'not-allowed' : 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 opacity: inputDesabilitado ? 0.5 : 1,
 }}>
 <IconePaperclip />
 </button>

 <input
 ref={fileInputRef}
 type="file"
 accept={TIPOS_ACEITOS}
 style={{ display: 'none' }}
 onChange={handleArquivo}
 />

 <textarea
 ref={inputRef}
 value={input}
 onChange={e => setInput(e.target.value)}
 onKeyDown={handleKey}
 placeholder={anexo ? 'Descreva o que quer saber sobre este arquivo...' : 'Pergunte sobre argumentos, objeções, scripts de venda...'}
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

 {/* Botão enviar */}
 <button
 onClick={() => enviar()}
 disabled={((!input.trim() && !anexo) || inputDesabilitado)}
 style={{
 width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
 background: (input.trim() || anexo) && !inputDesabilitado ? '#4f46e5' : 'var(--avp-border)',
 color: '#fff',
 cursor: (input.trim() || anexo) && !inputDesabilitado ? 'pointer' : 'not-allowed',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: 20, fontWeight: 700, transition: 'background 0.15s',
 }}>
 ↑
 </button>
 </div>

 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', textAlign: 'center', margin: '8px 0 0' }}>
 {custoPorMsg} crédito{custoPorMsg> 1 ? 's' : ''} por mensagem · Enter envia · Shift+Enter nova linha
 </p>
 </div>
 </div>
 </>
 )
}
