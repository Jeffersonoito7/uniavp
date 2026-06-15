'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

type Props = {
 alunoId: string
 linkAtual: string | null
}

export default function LinkParceiroCard({ alunoId, linkAtual }: Props) {
 const [link, setLink] = useState(linkAtual ?? '')
 const [salvando, setSalvando] = useState(false)
 const [msg, setMsg] = useState<'ok' | 'err' | null>(null)

 async function salvar(e: React.FormEvent) {
 e.preventDefault()
 setSalvando(true)
 setMsg(null)
 const res = await fetch('/api/perfil', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aluno_id: alunoId, link_externo: link.trim() || null }),
 })
 setMsg(res.ok ? 'ok' : 'err')
 setSalvando(false)
 setTimeout(() => setMsg(null), 3000)
 }

 return (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '18px 20px', marginBottom: 28 }}>
 <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 7 }}>
 <Link2 size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
 Meu link da plataforma parceira
 </p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 12px' }}>
 Cole aqui o seu link de indicação. Aparece para quem você recrutar ao completar certas aulas.
 </p>
 <form onSubmit={salvar} style={{ display: 'flex', gap: 8 }}>
 <input
 value={link}
 onChange={e => setLink(e.target.value)}
 placeholder="https://..."
 style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 13px', color: 'var(--avp-text)', fontSize: 13, outline: 'none' }}
 />
 <button
 type="submit"
 disabled={salvando}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, opacity: salvando ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
 {msg === 'ok' ? <><Check size={13} /> Salvo</> : salvando ? 'Salvando...' : 'Salvar'}
 </button>
 </form>
 {msg === 'err' && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>Erro ao salvar. Tente novamente.</p>}
 </div>
 )
}
