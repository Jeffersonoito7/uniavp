'use client'
import { useRef, useState } from 'react'

type Template = {
 id: string; tipo: string; titulo: string; arte_url: string | null;
 foto_x: number | null; foto_y: number | null; foto_largura: number | null; foto_altura: number | null;
 foto_redondo: boolean | null; ativo: boolean | null; formato: string | null;
 texto_ativo?: boolean | null; texto_template?: string | null;
 texto_fonte?: string | null; texto_x?: number | null; texto_y?: number | null; texto_tamanho?: number | null;
 texto_cor?: string | null; texto_negrito?: boolean | null; texto_alinhamento?: string | null; texto_sombra?: boolean | null;
}

function supabase() { return null } // não usado diretamente

export default function ArtesCliente({ inicial }: { inicial: Template[] }) {
 const [templates, setTemplates] = useState<Template[]>(inicial)
 const [aba, setAba] = useState<'feed' | 'stories'>('feed')
 const [salvando, setSalvando] = useState(false)
 const [criando, setCriando] = useState(false)
 const [duplicando, setDuplicando] = useState(false)
 const [msg, setMsg] = useState('')
 const [uploading, setUploading] = useState<string | null>(null)
 const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

 function atualizar(id: string, campo: keyof Template, valor: string | number | boolean) {
 setTemplates(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t))
 }

 async function criar() {
 setCriando(true); setMsg('')
 const res = await fetch('/api/admin/artes', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ formato: aba, titulo: 'Novo Template', tipo: 'custom' }),
 })
 const novo = await res.json()
 if (res.ok && novo.id) {
 setTemplates(prev => [...prev, novo])
 setMsg('Template criado! Configure e salve.')
 } else {
 setMsg('Erro ao criar template.')
 }
 setCriando(false)
 }

 async function duplicarComoStories() {
 const feeds = templates.filter(t => t.formato === 'feed')
 if (feeds.length === 0) { setMsg('Nenhum template Feed para duplicar.'); return }
 setDuplicando(true); setMsg('')
 const novos = feeds.map(t => ({
 tipo: t.tipo,
 titulo: t.titulo.replace(' (Feed)', '') + ' (Stories)',
 arte_url: '',
 foto_x: t.foto_x, foto_y: t.foto_y,
 foto_largura: t.foto_largura, foto_altura: t.foto_altura,
 foto_redondo: t.foto_redondo,
 ativo: true,
 formato: 'stories',
 }))
 const res = await fetch('/api/admin/artes', {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(novos),
 })
 const criados = await res.json()
 if (res.ok) {
 const lista = Array.isArray(criados) ? criados : [criados]
 setTemplates(prev => [...prev, ...lista])
 setAba('stories')
 setMsg(`${lista.length} templates Stories criados! Agora suba o PNG de cada um.`)
 } else {
 setMsg('Erro ao duplicar.')
 }
 setDuplicando(false)
 }

 async function excluir(id: string) {
 if (!confirm('Excluir este template?')) return
 await fetch('/api/admin/artes', {
 method: 'DELETE', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id }),
 })
 setTemplates(prev => prev.filter(t => t.id !== id))
 setMsg('Template excluído.')
 }

 async function uploadArte(templateId: string, file: File) {
 setUploading(templateId); setMsg('')
 const ext = file.name.split('.').pop() || 'png'
 const path = `artes/${templateId}-${Date.now()}.${ext}`
 const formData = new FormData()
 formData.append('file', file)
 formData.append('bucket', 'artes')
 formData.append('path', path)
 const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
 const data = await res.json()
 if (!res.ok || !data.url) {
 setMsg(`Erro no upload: ${data.error || 'Tente novamente.'}`)
 } else {
 atualizar(templateId, 'arte_url', data.url)
 setMsg('Arte enviada! Clique em Salvar para confirmar.')
 }
 setUploading(null)
 }

 async function salvar() {
 setSalvando(true); setMsg('')
 const res = await fetch('/api/admin/artes', {
 method: 'PUT', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(templates),
 })
 setSalvando(false)
 setMsg(res.ok ? 'Templates salvos com sucesso!' : 'Erro ao salvar.')
 }

 const inputStyle: React.CSSProperties = {
 width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
 borderRadius: 6, padding: '8px 10px', color: 'var(--avp-text)', fontSize: 13,
 outline: 'none', boxSizing: 'border-box',
 }
 const labelStyle: React.CSSProperties = {
 display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 4, fontWeight: 500,
 }

 const filtrados = templates.filter(t => t.formato === aba)
 const temStoriesDeTodos = templates.filter(t => t.formato === 'feed').every(f =>
 templates.some(s => s.formato === 'stories' && s.tipo === f.tipo)
 )

 return (
 <div>
 {/* Info */}
 <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, fontSize: 13, color: 'var(--avp-text-dim)' }}>
 <strong style={{ color: 'var(--avp-text)' }}>Como funciona:</strong> Faça upload do PNG com fundo transparente usando o botão <strong style={{ color: 'var(--avp-text)' }}>Subir Arte</strong>. Configure X/Y/Largura/Altura (% da imagem) para posicionar a foto do consultor. Os templates aparecem automaticamente para todos os gestores.
 </div>

 {/* Tabs + ações */}
 <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
 {(['feed', 'stories'] as const).map(f => (
 <button key={f} onClick={() => setAba(f)}
 style={{
 background: aba === f ? 'var(--grad-brand)' : 'var(--avp-card)',
 border: `1px solid ${aba === f ? 'transparent' : 'var(--avp-border)'}`,
 borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
 color: aba === f ? '#fff' : 'var(--avp-text-dim)', fontWeight: 700, fontSize: 14,
 }}>
 {f === 'feed' ? 'Feed (1080×1080)' : 'Stories (1080×1920)'}
 <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
 {templates.filter(t => t.formato === f).length}
 </span>
 </button>
 ))}

 <button onClick={criar} disabled={criando}
 style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: criando ? 0.7 : 1 }}>
 {criando ? '...' : `+ Novo ${aba === 'feed' ? 'Feed' : 'Stories'}`}
 </button>

 {aba === 'feed' && !temStoriesDeTodos && templates.filter(t => t.formato === 'feed').length> 0 && (
 <button onClick={duplicarComoStories} disabled={duplicando}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13, opacity: duplicando ? 0.7 : 1 }}>
 {duplicando ? '...' : 'Criar versão Stories de todos'}
 </button>
 )}
 </div>

 {/* Lista */}
 {filtrados.length === 0 ? (
 <div style={{ textAlign: 'center', padding: 48, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, color: 'var(--avp-text-dim)' }}>
 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><circle cx="12" cy="12" r="10"/><path d="m8 14 2.5-3 2.5 2.5 2.5-3L18 14"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
 <p style={{ marginBottom: 12 }}>Nenhum template de {aba === 'feed' ? 'Feed' : 'Stories'}.</p>
 {aba === 'stories' && templates.filter(t => t.formato === 'feed').length> 0 && (
 <button onClick={duplicarComoStories} disabled={duplicando}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
 Criar versão Stories de todos os templates Feed
 </button>
 )}
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 {filtrados.map(t => (
 <div key={t.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, opacity: t.ativo ? 1 : 0.55 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
 <input
 value={t.titulo}
 onChange={e => atualizar(t.id, 'titulo', e.target.value)}
 style={{ ...inputStyle, fontWeight: 700, fontSize: 15 }}
 placeholder="Nome do template"
 />
 <input
 value={t.tipo}
 onChange={e => atualizar(t.id, 'tipo', e.target.value)}
 style={{ ...inputStyle, fontSize: 12, color: 'var(--avp-text-dim)' }}
 placeholder="Tipo (ex: boas_vindas, placa_ouro)"
 />
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
 <input type="checkbox" checked={t.ativo ?? false}
 onChange={e => atualizar(t.id, 'ativo', e.target.checked)}
 style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
 <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Ativo</span>
 </label>
 <button onClick={() => excluir(t.id)}
 style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--avp-danger)', fontSize: 12, fontWeight: 600 }}>
 Excluir
 </button>
 </div>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 <div>
 <label style={labelStyle}>Arte PNG (fundo transparente) — {aba === 'feed' ? '1080×1080px' : '1080×1920px'}</label>
 <div style={{ display: 'flex', gap: 8 }}>
 <input style={{ ...inputStyle, flex: 1 }}
 value={t.arte_url ?? ''}
 onChange={e => atualizar(t.id, 'arte_url', e.target.value)}
 placeholder="Cole a URL ou use o botão para fazer upload" />
 <input type="file" accept="image/png,image/webp,image/jpeg"
 style={{ display: 'none' }}
 ref={el => { inputRefs.current[t.id] = el }}
 onChange={e => { const f = e.target.files?.[0]; if (f) uploadArte(t.id, f); e.target.value = '' }} />
 <button onClick={() => inputRefs.current[t.id]?.click()}
 disabled={uploading === t.id}
 style={{ background: uploading === t.id ? 'var(--avp-border)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 14px', cursor: uploading === t.id ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
 {uploading === t.id ? 'Enviando...' : 'Subir Arte'}
 </button>
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
 {(['foto_x', 'foto_y', 'foto_largura', 'foto_altura'] as const).map((campo, i) => (
 <div key={campo}>
 <label style={labelStyle}>{['Foto X (%)', 'Foto Y (%)', 'Largura (%)', 'Altura (%)'][i]}</label>
 <input type="number" min={0} max={100} style={inputStyle}
 value={t[campo] as number}
 onChange={e => atualizar(t.id, campo, Number(e.target.value))} />
 </div>
 ))}
 </div>
 <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
 <input type="checkbox" checked={t.foto_redondo ?? false}
 onChange={e => atualizar(t.id, 'foto_redondo', e.target.checked)}
 style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
 <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Foto em formato circular</span>
 </label>

 {/* ── Configurações do texto sobreposto ── */}
 <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 12, marginTop: 4 }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
 <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: 0 }}>Texto sobreposto na arte</p>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
 <input type="checkbox" checked={!!t.texto_ativo} onChange={e => atualizar(t.id, 'texto_ativo', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
 <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Ativar texto</span>
 </label>
 </div>
 {t.texto_ativo && (<>
 <div style={{ marginBottom: 10 }}>
 <label style={labelStyle}>Texto <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>— use <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{nome}'}</code> para inserir o nome</span></label>
 <input style={inputStyle} value={t.texto_template ?? '{nome}'} onChange={e => atualizar(t.id, 'texto_template', e.target.value)} placeholder="Ex: Parabéns, {nome}! " />
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>
 Exemplos: <em>Parabéns, {'{nome}'}!</em> · <em>Seja bem-vindo, {'{nome}'}!</em> · <em>{'{nome}'} — Placa 40</em>
 </p>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
 <div>
 <label style={labelStyle}>Fonte</label>
 <select style={{ ...inputStyle, cursor: 'pointer' }} value={t.texto_fonte ?? 'Inter, Arial, sans-serif'}
 onChange={e => atualizar(t.id, 'texto_fonte', e.target.value)}>
 <option value="Inter, Arial, sans-serif">Inter / Arial (padrão)</option>
 <option value="Georgia, serif">Georgia (Serif)</option>
 <option value="'Times New Roman', serif">Times New Roman</option>
 <option value="'Palatino Linotype', serif">Palatino</option>
 <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
 <option value="Impact, sans-serif">Impact (forte)</option>
 <option value="'Courier New', monospace">Courier New (mono)</option>
 </select>
 </div>
 <div>
 <label style={labelStyle}>Cor do texto</label>
 <div style={{ display: 'flex', gap: 6 }}>
 <input type="color" value={t.texto_cor ?? '#FFFFFF'} onChange={e => atualizar(t.id, 'texto_cor', e.target.value)}
 style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--avp-border)', background: 'none', cursor: 'pointer', padding: 2 }} />
 <input style={{ ...inputStyle, flex: 1 }} value={t.texto_cor ?? '#FFFFFF'} onChange={e => atualizar(t.id, 'texto_cor', e.target.value)} placeholder="#FFFFFF" />
 </div>
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
 <div>
 <label style={labelStyle}>X (%)</label>
 <input type="number" min={0} max={100} style={inputStyle} value={t.texto_x ?? 50} onChange={e => atualizar(t.id, 'texto_x', Number(e.target.value))} />
 </div>
 <div>
 <label style={labelStyle}>Y (%)</label>
 <input type="number" min={0} max={100} style={inputStyle} value={t.texto_y ?? 85} onChange={e => atualizar(t.id, 'texto_y', Number(e.target.value))} />
 </div>
 <div>
 <label style={labelStyle}>Tamanho (%)</label>
 <input type="number" min={1} max={20} step={0.5} style={inputStyle} value={t.texto_tamanho ?? 5} onChange={e => atualizar(t.id, 'texto_tamanho', Number(e.target.value))} />
 </div>
 <div>
 <label style={labelStyle}>Alinhamento</label>
 <select style={{ ...inputStyle, cursor: 'pointer' }} value={t.texto_alinhamento ?? 'center'} onChange={e => atualizar(t.id, 'texto_alinhamento', e.target.value)}>
 <option value="center">Centro</option>
 <option value="left">Esquerda</option>
 <option value="right">Direita</option>
 </select>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 16 }}>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
 <input type="checkbox" checked={t.texto_negrito !== false} onChange={e => atualizar(t.id, 'texto_negrito', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
 <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Negrito</span>
 </label>
 <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
 <input type="checkbox" checked={t.texto_sombra !== false} onChange={e => atualizar(t.id, 'texto_sombra', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--avp-green)' }} />
 <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Sombra no texto</span>
 </label>
 </div>
 </>)}
 </div>
 </div>

 {t.arte_url ? (
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
 <img src={t.arte_url} alt={t.titulo}
 style={{ width: aba === 'stories' ? 45 : 72, height: aba === 'stories' ? 80 : 72, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--avp-border)' }}
 onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
 <button onClick={() => inputRefs.current[t.id]?.click()}
 style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--avp-text-dim)', cursor: 'pointer' }}>
 Trocar
 </button>
 </div>
 ) : (
 <button onClick={() => inputRefs.current[t.id]?.click()}
 style={{ width: 72, height: 72, background: 'var(--avp-black)', border: '2px dashed var(--avp-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 +
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}

 {msg && (
 <p style={{ fontSize: 14, marginTop: 16, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>
 )}

 <button onClick={salvar} disabled={salvando}
 style={{ marginTop: 20, background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
 {salvando ? 'Salvando...' : 'Salvar todos os templates'}
 </button>
 </div>
 )
}
