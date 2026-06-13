'use client'
import { useState, useRef } from 'react'

type Documento = {
 id: string
 titulo: string
 descricao: string | null
 pdf_url: string
 painel: string
 ativo: boolean | null
 ordem: number | null
 created_at: string | null
}

const painelLabel: Record<string, string> = {
 free: '🆓 Painel FREE',
 pro: 'Painel PRO',
 ambos: '🆓 Ambos os painéis',
}

const painelCor: Record<string, string> = {
 free: 'rgba(2,161,83,0.15)',
 pro: 'rgba(99,102,241,0.15)',
 ambos: 'rgba(255,255,255,0.08)',
}

export default function DocumentosCliente({ documentosIniciais }: { documentosIniciais: Documento[] }) {
 const [docs, setDocs] = useState(documentosIniciais)
 const [modal, setModal] = useState(false)
 const [editando, setEditando] = useState<Documento | null>(null)
 const [form, setForm] = useState({ titulo: '', descricao: '', pdf_url: '', painel: 'ambos', ordem: '0' })
 const [loading, setLoading] = useState(false)
 const [uploading, setUploading] = useState(false)
 const [msg, setMsg] = useState('')
 const fileRef = useRef<HTMLInputElement>(null)

 function abrirNovo() {
 setEditando(null)
 setForm({ titulo: '', descricao: '', pdf_url: '', painel: 'ambos', ordem: '0' })
 setModal(true)
 }

 function abrirEditar(doc: Documento) {
 setEditando(doc)
 setForm({ titulo: doc.titulo, descricao: doc.descricao || '', pdf_url: doc.pdf_url, painel: doc.painel, ordem: String(doc.ordem) })
 setModal(true)
 }

 async function uploadPDF(file: File) {
 setUploading(true)
 setMsg('')
 const formData = new FormData()
 formData.append('file', file)
 formData.append('bucket', 'documentos')
 formData.append('path', `painel/${Date.now()}_${file.name.replace(/\s/g, '_')}`)
 try {
 const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
 const data = await res.json()
 if (data.url) {
 setForm(p => ({ ...p, pdf_url: data.url }))
 setMsg('PDF enviado com sucesso!')
 } else {
 setMsg('Erro no upload: ' + (data.error || 'tente novamente'))
 }
 } catch {
 setMsg('Erro ao enviar o PDF')
 }
 setUploading(false)
 }

 async function salvar() {
 if (!form.titulo || !form.pdf_url) { setMsg('Título e PDF são obrigatórios'); return }
 setLoading(true)
 setMsg('')
 const body = { ...form, ordem: parseInt(form.ordem) || 0, ...(editando ? { id: editando.id } : {}) }
 const res = await fetch('/api/admin/documentos', {
 method: editando ? 'PUT' : 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 })
 const data = await res.json()
 if (res.ok) {
 if (editando) {
 setDocs(d => d.map(x => x.id === data.id ? data : x))
 } else {
 setDocs(d => [data, ...d])
 }
 setModal(false)
 setMsg('')
 } else {
 setMsg(data.error || 'Erro ao salvar')
 }
 setLoading(false)
 }

 async function toggleAtivo(doc: Documento) {
 const res = await fetch('/api/admin/documentos', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...doc, ativo: !doc.ativo }),
 })
 if (res.ok) setDocs(d => d.map(x => x.id === doc.id ? { ...x, ativo: !x.ativo } : x))
 }

 async function excluir(id: string) {
 if (!confirm('Excluir este documento?')) return
 const res = await fetch(`/api/admin/documentos?id=${id}`, { method: 'DELETE' })
 if (res.ok) setDocs(d => d.filter(x => x.id !== id))
 }

 const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
 const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }

 return (
 <>
 <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
 <div>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Documentos do Painel</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
 PDFs disponíveis para download nos painéis dos consultores
 </p>
 </div>
 <button onClick={abrirNovo}
 style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
 + Adicionar documento
 </button>
 </div>

 {docs.length === 0 ? (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--avp-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
 <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)', marginBottom: 8 }}>Nenhum documento cadastrado</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 24 }}>Adicione PDFs como manuais, guias ou contratos para disponibilizar nos painéis</p>
 <button onClick={abrirNovo} style={{ background: 'var(--avp-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
 + Adicionar primeiro documento
 </button>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 {docs.map(doc => (
 <div key={doc.id} style={{ background: 'var(--avp-card)', border: `1px solid ${doc.ativo ? 'var(--avp-border)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: doc.ativo ? 1 : 0.5 }}>
 <div style={{ flexShrink: 0, color: 'var(--avp-text-dim)' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
 <div style={{ flex: 1, minWidth: 200 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
 <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)', margin: 0 }}>{doc.titulo}</p>
 <span style={{ background: painelCor[doc.painel] || painelCor.ambos, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>
 {painelLabel[doc.painel] || doc.painel}
 </span>
 {!doc.ativo && <span style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, color: '#f87171' }}>Inativo</span>}
 </div>
 {doc.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>{doc.descricao}</p>}
 </div>
 <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
 <a href={doc.pdf_url} target="_blank" rel="noreferrer"
 style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
 Ver PDF
 </a>
 <button onClick={() => abrirEditar(doc)}
 style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
 Editar
 </button>
 <button onClick={() => toggleAtivo(doc)}
 style={{ background: doc.ativo ? 'rgba(248,113,113,0.08)' : 'rgba(2,161,83,0.08)', border: `1px solid ${doc.ativo ? 'rgba(248,113,113,0.2)' : 'rgba(2,161,83,0.2)'}`, color: doc.ativo ? '#f87171' : '#02A153', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
 {doc.ativo ? 'Desativar' : 'Ativar'}
 </button>
 <button onClick={() => excluir(doc.id)}
 style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', borderRadius: 8, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
 Excluir
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Modal */}
 {modal && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 36, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
 <h2 style={{ fontWeight: 800, fontSize: 20, color: 'var(--avp-text)', marginBottom: 24 }}>
 {editando ? 'Editar documento' : '+ Novo documento'}
 </h2>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={lbl}>Título do documento *</label>
 <input style={inp} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Manual do Consultor" />
 </div>

 <div>
 <label style={lbl}>Descrição</label>
 <input style={inp} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Guia completo de atuação do consultor" />
 </div>

 <div>
 <label style={lbl}>Aparece em qual painel? *</label>
 <select style={{ ...inp, cursor: 'pointer' }} value={form.painel} onChange={e => setForm(p => ({ ...p, painel: e.target.value }))}>
 <option value="ambos">🆓 Ambos os painéis (FREE e PRO)</option>
 <option value="free">🆓 Apenas painel FREE</option>
 <option value="pro">Apenas painel PRO</option>
 </select>
 </div>

 <div>
 <label style={lbl}>Ordem de exibição</label>
 <input style={{ ...inp, width: 100 }} type="number" min="0" value={form.ordem} onChange={e => setForm(p => ({ ...p, ordem: e.target.value }))} placeholder="0" />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Menor número aparece primeiro</p>
 </div>

 <div>
 <label style={lbl}>Arquivo PDF *</label>
 {form.pdf_url ? (
 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
 <a href={form.pdf_url} target="_blank" rel="noreferrer"
 style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', color: '#02A153', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
 PDF carregado — Ver arquivo
 </a>
 <button onClick={() => setForm(p => ({ ...p, pdf_url: '' }))}
 style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}>
 Trocar
 </button>
 </div>
 ) : (
 <div>
 <input type="file" accept="application/pdf" style={{ display: 'none' }} ref={fileRef}
 onChange={e => { const f = e.target.files?.[0]; if (f) uploadPDF(f); e.target.value = '' }} />
 <button onClick={() => fileRef.current?.click()} disabled={uploading}
 style={{ background: uploading ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
 {uploading ? 'Enviando...' : 'Selecionar PDF'}
 </button>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>Máximo 10MB · somente PDF</p>
 </div>
 )}
 </div>
 </div>

 {msg && (
 <div style={{ marginTop: 16, padding: '10px 14px', background: msg.includes('sucesso') || msg.includes('enviado') ? 'rgba(2,161,83,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${msg.includes('sucesso') || msg.includes('enviado') ? 'rgba(2,161,83,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 8, color: msg.includes('sucesso') || msg.includes('enviado') ? '#02A153' : '#f87171', fontSize: 13 }}>
 {msg}
 </div>
 )}

 <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
 <button onClick={() => { setModal(false); setMsg('') }}
 style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
 Cancelar
 </button>
 <button onClick={salvar} disabled={loading || !form.titulo || !form.pdf_url}
 style={{ flex: 2, background: !form.titulo || !form.pdf_url ? 'rgba(99,102,241,0.3)' : 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 15, cursor: loading || !form.titulo || !form.pdf_url ? 'not-allowed' : 'pointer' }}>
 {loading ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar documento'}
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )
}
