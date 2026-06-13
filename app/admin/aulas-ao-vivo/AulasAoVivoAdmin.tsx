'use client'
import { useState } from 'react'
import { Video, Plus, Trash2, ExternalLink, Edit2, Check, X } from 'lucide-react'
import { TogglePill } from '@/app/components/TogglePill'

type AulaAoVivo = {
 id: string; titulo: string; descricao: string | null; plataforma: string
 link: string; data_hora: string; duracao_minutos: number | null; obrigatoria: boolean | null
 gravacao_url: string | null; lembrete_enviado: boolean | null; criado_por: string; created_at: string | null
}

const input: React.CSSProperties = {
 width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
 borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14,
 outline: 'none', boxSizing: 'border-box',
}
const label: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

const ICONE = { zoom: '', meet: '' }
const NOME = { zoom: 'Zoom', meet: 'Google Meet' }

function fmt(iso: string) {
 return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toLocalDatetime(iso: string) {
 const d = new Date(iso)
 const pad = (n: number) => String(n).padStart(2, '0')
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AulasAoVivoAdmin({ inicial }: { inicial: AulaAoVivo[] }) {
 const [aulas, setAulas] = useState<AulaAoVivo[]>(inicial)
 const [form, setForm] = useState({ titulo: '', descricao: '', plataforma: 'zoom' as 'zoom' | 'meet', link: '', data_hora: '', duracao_minutos: 60, obrigatoria: false })
 const [salvando, setSalvando] = useState(false)
 const [msg, setMsg] = useState('')
 const [editandoGravacao, setEditandoGravacao] = useState<string | null>(null)
 const [gravacaoUrl, setGravacaoUrl] = useState('')

 async function criar() {
 if (!form.titulo || !form.link || !form.data_hora) { setMsg('Preencha título, link e data/hora.'); return }
 setSalvando(true); setMsg('')
 const res = await fetch('/api/aulas-ao-vivo', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(form),
 })
 if (res.ok) {
 const nova = await res.json()
 setAulas(prev => [...prev, nova].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()))
 setForm({ titulo: '', descricao: '', plataforma: 'zoom', link: '', data_hora: '', duracao_minutos: 60, obrigatoria: false })
 setMsg(' Aula ao vivo criada!')
 } else { setMsg(' Erro ao criar.') }
 setSalvando(false)
 }

 async function excluir(id: string) {
 if (!confirm('Excluir esta aula ao vivo?')) return
 await fetch('/api/aulas-ao-vivo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
 setAulas(prev => prev.filter(a => a.id !== id))
 }

 async function salvarGravacao(id: string) {
 const res = await fetch('/api/aulas-ao-vivo', {
 method: 'PATCH', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, gravacao_url: gravacaoUrl }),
 })
 if (res.ok) {
 const updated = await res.json()
 setAulas(prev => prev.map(a => a.id === id ? updated : a))
 setEditandoGravacao(null); setGravacaoUrl('')
 }
 }

 const futuras = aulas.filter(a => new Date(a.data_hora)>= new Date())
 const passadas = aulas.filter(a => new Date(a.data_hora) < new Date())

 return (
 <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32, alignItems: 'start' }}>
 {/* Formulário */}
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
 <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Nova Aula ao Vivo</p>

 <div><label style={label}>Título *</label><input style={input} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Técnicas de abordagem" /></div>

 <div><label style={label}>Plataforma *</label>
 <div style={{ display: 'flex', gap: 8 }}>
 {(['zoom', 'meet'] as const).map(p => (
 <button key={p} onClick={() => setForm(prev => ({ ...prev, plataforma: p }))}
 style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `2px solid ${form.plataforma === p ? (p === 'zoom' ? '#2D8CFF' : '#34A853') : 'var(--avp-border)'}`, background: form.plataforma === p ? (p === 'zoom' ? 'rgba(45,140,255,0.1)' : 'rgba(52,168,83,0.1)') : 'transparent', color: 'var(--avp-text)', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
 {ICONE[p]} {NOME[p]}
 </button>
 ))}
 </div>
 </div>

 <div><label style={label}>Link da reunião *</label><input style={input} value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://zoom.us/j/... ou meet.google.com/..." /></div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <div><label style={label}>Data e Hora *</label><input type="datetime-local" style={input} value={form.data_hora} onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))} /></div>
 <div><label style={label}>Duração (min)</label><input type="number" style={input} value={form.duracao_minutos} onChange={e => setForm(p => ({ ...p, duracao_minutos: Number(e.target.value) }))} min={15} max={480} /></div>
 </div>

 <div><label style={label}>Descrição</label><textarea style={{ ...input, minHeight: 64, resize: 'vertical' }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Assuntos abordados..." /></div>

 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
 <input type="checkbox" checked={form.obrigatoria} onChange={e => setForm(p => ({ ...p, obrigatoria: e.target.checked }))} style={{ display: 'none' }} />
 <TogglePill checked={form.obrigatoria} />
 <span style={{ color: 'var(--avp-text)' }}>Presença obrigatória</span>
 </label>

 {msg && <p style={{ fontSize: 13, color: msg.startsWith('') ? '#22c55e' : '#ef4444', margin: 0 }}>{msg}</p>}

 <button onClick={criar} disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
 <Plus size={16} />{salvando ? 'Criando...' : 'Criar Aula ao Vivo'}
 </button>

 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0, lineHeight: 1.5 }}>
 Lembrete automático via WhatsApp é enviado para <strong>todos os consultores</strong> 1 hora antes.
 </p>
 </div>

 {/* Lista */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
 {/* Próximas */}
 <div>
 <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Próximas ({futuras.length})</p>
 {futuras.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhuma aula agendada.</p>}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {futuras.map(aula => (
 <AulaCard key={aula.id} aula={aula} onExcluir={excluir} onEditarGravacao={id => { setEditandoGravacao(id); setGravacaoUrl(aula.gravacao_url ?? '') }}
 editandoGravacao={editandoGravacao} gravacaoUrl={gravacaoUrl} setGravacaoUrl={setGravacaoUrl} onSalvarGravacao={salvarGravacao} onCancelarGravacao={() => setEditandoGravacao(null)} />
 ))}
 </div>
 </div>

 {/* Passadas */}
 {passadas.length> 0 && (
 <div>
 <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: 'var(--avp-text-dim)' }}>Encerradas ({passadas.length})</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {passadas.slice().reverse().map(aula => (
 <AulaCard key={aula.id} aula={aula} onExcluir={excluir} onEditarGravacao={id => { setEditandoGravacao(id); setGravacaoUrl(aula.gravacao_url ?? '') }}
 editandoGravacao={editandoGravacao} gravacaoUrl={gravacaoUrl} setGravacaoUrl={setGravacaoUrl} onSalvarGravacao={salvarGravacao} onCancelarGravacao={() => setEditandoGravacao(null)} encerrada />
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )
}

function AulaCard({ aula, onExcluir, onEditarGravacao, editandoGravacao, gravacaoUrl, setGravacaoUrl, onSalvarGravacao, onCancelarGravacao, encerrada = false }: {
 aula: AulaAoVivo; onExcluir: (id: string) => void
 onEditarGravacao: (id: string) => void; editandoGravacao: string | null
 gravacaoUrl: string; setGravacaoUrl: (v: string) => void
 onSalvarGravacao: (id: string) => void; onCancelarGravacao: () => void; encerrada?: boolean
}) {
 const cor = aula.plataforma === 'zoom' ? '#2D8CFF' : '#34A853'
 return (
 <div style={{ background: 'var(--avp-card)', border: `1px solid ${encerrada ? 'var(--avp-border)' : cor}`, borderRadius: 10, padding: 16, opacity: encerrada ? 0.7 : 1 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
 <span style={{ background: cor, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{ICONE[aula.plataforma as 'zoom' | 'meet']} {NOME[aula.plataforma as 'zoom' | 'meet']}</span>
 {aula.obrigatoria && <span style={{ background: '#ef444420', color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Obrigatória</span>}
 {aula.lembrete_enviado && <span style={{ background: '#22c55e20', color: '#22c55e', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>Lembrete enviado</span>}
 </div>
 <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{aula.titulo}</p>
 {aula.descricao && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '0 0 6px' }}>{aula.descricao}</p>}
 <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: 0 }}> {fmt(aula.data_hora)} · {aula.duracao_minutos} min</p>
 </div>
 <div style={{ display: 'flex', gap: 6 }}>
 <a href={aula.link} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', borderRadius: 6, background: cor + '20', color: cor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
 <ExternalLink size={13} /> Abrir
 </a>
 <button onClick={() => onEditarGravacao(aula.id)} style={{ padding: '6px 10px', borderRadius: 6, background: '#8b5cf620', color: '#8b5cf6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
 <Video size={13} /> {aula.gravacao_url ? 'Editar gravação' : 'Add gravação'}
 </button>
 <button onClick={() => onExcluir(aula.id)} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef444420', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
 <Trash2 size={14} />
 </button>
 </div>
 </div>

 {/* Gravação existente */}
 {aula.gravacao_url && editandoGravacao !== aula.id && (
 <div style={{ marginTop: 10, padding: '8px 12px', background: '#8b5cf610', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
 <Video size={13} color="#8b5cf6" />
 <a href={aula.gravacao_url} target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 600 }}>Ver gravação</a>
 </div>
 )}

 {/* Editar gravação */}
 {editandoGravacao === aula.id && (
 <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
 <input value={gravacaoUrl} onChange={e => setGravacaoUrl(e.target.value)} placeholder="https://..." style={{ ...input, flex: 1 }} />
 <button onClick={() => onSalvarGravacao(aula.id)} style={{ padding: '8px 14px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={15} /></button>
 <button onClick={onCancelarGravacao} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', cursor: 'pointer' }}><X size={15} /></button>
 </div>
 )}
 </div>
 )
}
