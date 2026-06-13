'use client'

import { useState } from 'react'
import { MENSAGENS_PADRAO } from '@/lib/mensagem'

type Template = { chave: string; texto: string; customizado: boolean }

export default function MensagensCliente({ iniciais }: { iniciais: Template[] }) {
 const [templates, setTemplates] = useState<Template[]>(iniciais)
 const [editando, setEditando] = useState<string | null>(null)
 const [textoEdit, setTextoEdit] = useState('')
 const [salvando, setSalvando] = useState(false)
 const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

 function abrirEditor(t: Template) {
 setEditando(t.chave)
 setTextoEdit(t.texto)
 setMsg(null)
 }

 function fecharEditor() {
 setEditando(null)
 setTextoEdit('')
 setMsg(null)
 }

 async function salvar(chave: string) {
 setSalvando(true)
 setMsg(null)
 try {
 const res = await fetch('/api/admin/mensagens', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ chave, texto: textoEdit }),
 })
 if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar')
 setTemplates(prev => prev.map(t => t.chave === chave ? { ...t, texto: textoEdit, customizado: true } : t))
 setMsg({ tipo: 'ok', texto: 'Salvo com sucesso.' })
 setEditando(null)
 } catch (e: any) {
 setMsg({ tipo: 'erro', texto: e.message })
 } finally {
 setSalvando(false)
 }
 }

 async function restaurar(chave: string) {
 if (!confirm('Restaurar o texto padrão para esta mensagem?')) return
 setSalvando(true)
 setMsg(null)
 try {
 const res = await fetch('/api/admin/mensagens', {
 method: 'DELETE',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ chave }),
 })
 if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao restaurar')
 const padrao = MENSAGENS_PADRAO[chave] ?? ''
 setTemplates(prev => prev.map(t => t.chave === chave ? { ...t, texto: padrao, customizado: false } : t))
 setMsg({ tipo: 'ok', texto: 'Texto padrão restaurado.' })
 } catch (e: any) {
 setMsg({ tipo: 'erro', texto: e.message })
 } finally {
 setSalvando(false)
 }
 }

 const grupos: Record<string, Template[]> = {}
 for (const t of templates) {
 const grupo = t.chave.split('_')[0]
 if (!grupos[grupo]) grupos[grupo] = []
 grupos[grupo].push(t)
 }

 return (
 <div>
 {msg && (
 <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
 background: msg.tipo === 'ok' ? '#f0fdf4' : '#fef2f2',
 color: msg.tipo === 'ok' ? '#16a34a' : '#dc2626',
 border: `1px solid ${msg.tipo === 'ok' ? '#bbf7d0' : '#fecaca'}`,
 }}>
 {msg.texto}
 </div>
 )}

 {Object.entries(grupos).map(([grupo, itens]) => (
 <div key={grupo} style={{ marginBottom: 32 }}>
 <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
 {grupo}
 </h2>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {itens.map(t => (
 <div key={t.chave} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
 <div>
 <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--avp-text-dim)', background: 'var(--avp-bg)', padding: '2px 6px', borderRadius: 4 }}>
 {t.chave}
 </span>
 {t.customizado && (
 <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>personalizado</span>
 )}
 </div>
 <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
 {t.customizado && (
 <button
 onClick={() => restaurar(t.chave)}
 disabled={salvando}
 style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--avp-border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--avp-text-dim)' }}
>
 Restaurar padrão
 </button>
 )}
 <button
 onClick={() => abrirEditor(t)}
 style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--avp-primary)', cursor: 'pointer', fontSize: 12, color: '#fff' }}
>
 Editar
 </button>
 </div>
 </div>
 <pre style={{ margin: 0, fontSize: 12, color: 'var(--avp-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, fontFamily: 'inherit' }}>
 {t.texto}
 </pre>
 </div>
 ))}
 </div>
 </div>
 ))}

 {/* Modal de edição */}
 {editando && (
 <div
 onClick={fecharEditor}
 style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
>
 <div
 onClick={e => e.stopPropagation()}
 style={{ background: 'var(--avp-card)', borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}
>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--avp-text-dim)' }}>{editando}</span>
 <button onClick={fecharEditor} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--avp-text-dim)' }}>×</button>
 </div>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 8 }}>
 Use {'{variavel}'} para inserir valores dinâmicos.
 </p>
 <textarea
 value={textoEdit}
 onChange={e => setTextoEdit(e.target.value)}
 rows={12}
 style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--avp-border)', background: 'var(--avp-bg)', color: 'var(--avp-text)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
 />
 {msg && (
 <p style={{ fontSize: 12, color: msg.tipo === 'ok' ? '#16a34a' : '#dc2626', margin: '8px 0 0' }}>{msg.texto}</p>
 )}
 <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
 <button onClick={fecharEditor} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--avp-border)', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--avp-text-dim)' }}>
 Cancelar
 </button>
 <button
 onClick={() => salvar(editando)}
 disabled={salvando}
 style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--avp-primary)', cursor: 'pointer', fontSize: 13, color: '#fff', opacity: salvando ? 0.6 : 1 }}
>
 {salvando ? 'Salvando...' : 'Salvar'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
