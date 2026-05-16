'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function CapaUpload({ preview, onSelect, fileRef: ref }: {
  preview: string | null
  onSelect: (f: File) => void
  fileRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div onClick={() => ref.current?.click()} style={{ width: 110, height: 86, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px dashed ${preview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22, color: 'var(--avp-text-dim)' }}>🖼️</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); e.target.value = '' }} />
        <button type="button" onClick={() => ref.current?.click()} style={{ background: preview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          {preview ? '🔄 Trocar' : '📤 Subir capa'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>1380×1080px · máx. 3MB</p>
      </div>
    </div>
  )
}

const PERFIS = [
  { id: 'consultor', label: 'FREE',   cor: '#02A153', bg: '#02A15320' },
  { id: 'gestor',    label: 'PRO',    cor: '#3b82f6', bg: '#3b82f620' },
  { id: 'outros',    label: 'Outros', cor: '#a78bfa', bg: '#a78bfa20' },
] as const
type PerfilId = typeof PERFIS[number]['id']

type Modulo = {
  id: string
  titulo: string
  descricao: string | null
  capa_url: string | null
  ordem: number
  publicado: boolean
  perfis_permitidos: PerfilId[]
}

type EditForm = { titulo: string; descricao: string; capaPreview: string | null; capaBase64: string | null; perfis_permitidos: PerfilId[] }

export default function ModulosCliente({ modulosIniciais, capaDefault }: { modulosIniciais: Modulo[]; capaDefault?: string | null }) {
  const router = useRouter()
  const [modulos, setModulos] = useState<Modulo[]>(modulosIniciais)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', perfis_permitidos: ['consultor', 'gestor'] as PerfilId[] })
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [capaBase64, setCapaBase64] = useState<string | null>(null)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Edição
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ titulo: '', descricao: '', capaPreview: null, capaBase64: null, perfis_permitidos: ['consultor', 'gestor'] })
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }
  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }

  function selecionarCapa(file: File, isEdit = false) {
    if (file.size > 3 * 1024 * 1024) { setMsg({ tipo: 'err', texto: 'Imagem muito grande. Use até 3MB.' }); return }
    setUploadando(true)
    const blobUrl = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = ev.target?.result as string
      if (isEdit) setEditForm(p => ({ ...p, capaPreview: blobUrl, capaBase64: b64 }))
      else { setCapaPreview(blobUrl); setCapaBase64(b64) }
      setUploadando(false)
    }
    reader.readAsDataURL(file)
  }

  function togglePerfilForm(perfil: PerfilId, isEdit = false) {
    if (isEdit) {
      setEditForm(p => ({
        ...p,
        perfis_permitidos: p.perfis_permitidos.includes(perfil)
          ? p.perfis_permitidos.filter(x => x !== perfil)
          : [...p.perfis_permitidos, perfil],
      }))
    } else {
      setForm(p => ({
        ...p,
        perfis_permitidos: p.perfis_permitidos.includes(perfil)
          ? p.perfis_permitidos.filter(x => x !== perfil)
          : [...p.perfis_permitidos, perfil],
      }))
    }
  }

  async function criarModulo(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/admin/modulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: form.titulo, descricao: form.descricao || null, capa_url: capaBase64 || null, perfis_permitidos: form.perfis_permitidos }),
    })
    const data = await res.json()
    if (data.modulo) {
      router.push(`/admin/modulos/${data.modulo.id}?aba=aulas`)
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar módulo.' })
      setSalvando(false)
    }
  }

  function abrirEdicao(m: Modulo) {
    setEditandoId(m.id)
    const temCapa = m.capa_url?.startsWith('data:') || m.capa_url?.startsWith('blob:')
    setEditForm({ titulo: m.titulo, descricao: m.descricao ?? '', capaPreview: temCapa ? m.capa_url : null, capaBase64: temCapa ? m.capa_url : null, perfis_permitidos: m.perfis_permitidos ?? ['consultor', 'gestor'] })
  }

  async function salvarEdicao(id: string) {
    setSalvandoEdit(true)
    const res = await fetch('/api/admin/modulos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, titulo: editForm.titulo, descricao: editForm.descricao || null, capa_url: editForm.capaBase64 || null, perfis_permitidos: editForm.perfis_permitidos }),
    })
    const data = await res.json()
    if (data.modulo) {
      setModulos(prev => prev.map(m => m.id === id ? data.modulo : m))
      setEditandoId(null)
      setMsg({ tipo: 'ok', texto: 'Módulo atualizado!' })
      setTimeout(() => setMsg(null), 3000)
    }
    setSalvandoEdit(false)
  }

  async function excluirModulo(m: Modulo) {
    if (!confirm(`Excluir o módulo "${m.titulo}"? Todas as aulas serão excluídas também.`)) return
    const res = await fetch('/api/admin/modulos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id }),
    })
    if (res.ok) setModulos(prev => prev.filter(x => x.id !== m.id))
    else setMsg({ tipo: 'err', texto: 'Erro ao excluir módulo.' })
  }

  async function togglePublicado(m: Modulo) {
    const res = await fetch('/api/admin/modulos', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, publicado: !m.publicado }),
    })
    const data = await res.json()
    if (data.modulo) setModulos(prev => prev.map(x => x.id === m.id ? { ...x, publicado: !x.publicado } : x))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14 }}>
          {msg.texto}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { setCriando(c => !c); setCapaPreview(null); setCapaBase64(null) }}
          style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {criando ? 'Cancelar' : '+ Novo Módulo'}
        </button>
      </div>

      {criando && (
        <form onSubmit={criarModulo} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>Novo Módulo</h3>
          <div><label style={lbl}>Título *</label><input style={inp} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required placeholder="Nome do módulo" /></div>
          <div><label style={lbl}>Descrição</label><input style={inp} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição opcional" /></div>
          <div>
            <label style={{ ...lbl, marginBottom: 8 }}>Capa <span style={{ color: 'var(--avp-green)', fontSize: 11, fontWeight: 700 }}>📐 1380×1080px</span></label>
            <CapaUpload preview={capaPreview} onSelect={f => selecionarCapa(f, false)} fileRef={fileRef} />
          </div>
          <div>
            <label style={{ ...lbl, marginBottom: 8 }}>🔐 Quem pode ver este módulo?</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PERFIS.map(p => {
                const ativo = form.perfis_permitidos.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePerfilForm(p.id, false)}
                    style={{ background: ativo ? p.bg : 'var(--avp-black)', border: `2px solid ${ativo ? p.cor : 'var(--avp-border)'}`, color: ativo ? p.cor : 'var(--avp-text-dim)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}>
                    {ativo ? '✓ ' : ''}{p.label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>Selecione quais perfis terão acesso a este módulo</p>
          </div>
          <button type="submit" disabled={salvando || uploadando} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Criando...' : 'Criar Módulo'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modulos.sort((a, b) => a.ordem - b.ordem).map(m => {
          const isEditing = editandoId === m.id
          const temCapa = m.capa_url?.startsWith('data:') || m.capa_url?.startsWith('blob:')
          return (
            <div key={m.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>
              {isEditing ? (
                <div style={{ padding: 20 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text-dim)' }}>Editando Módulo {m.ordem}</p>
                    <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
                  </div>
                  <div><label style={lbl}>Título *</label><input style={inp} value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                  <div><label style={lbl}>Descrição</label><input style={inp} value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} /></div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 8 }}>Capa <span style={{ color: 'var(--avp-green)', fontSize: 11, fontWeight: 700 }}>📐 1380×1080px</span></label>
                    <CapaUpload preview={editForm.capaPreview} onSelect={f => selecionarCapa(f, true)} fileRef={editFileRef} />
                  </div>
                  <div>
                    <label style={{ ...lbl, marginBottom: 8 }}>🔐 Quem pode ver este módulo?</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {PERFIS.map(perf => {
                        const ativo = editForm.perfis_permitidos.includes(perf.id)
                        return (
                          <button key={perf.id} type="button" onClick={() => togglePerfilForm(perf.id, true)}
                            style={{ background: ativo ? perf.bg : 'var(--avp-black)', border: `2px solid ${ativo ? perf.cor : 'var(--avp-border)'}`, color: ativo ? perf.cor : 'var(--avp-text-dim)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}>
                            {ativo ? '✓ ' : ''}{perf.label}
                          </button>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>Selecione quais perfis terão acesso a este módulo</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => salvarEdicao(m.id)} disabled={salvandoEdit}
                      style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvandoEdit ? 0.7 : 1 }}>
                      {salvandoEdit ? 'Salvando...' : '✓ Salvar'}
                    </button>
                    <button onClick={() => setEditandoId(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 14 }}>
                      Cancelar
                    </button>
                  </div>
                </div>
                </div>
              ) : (
                <div>
                  {/* Área clicável principal */}
                  <Link href={`/admin/modulos/${m.id}?aba=aulas`}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0, background: 'var(--avp-card)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--avp-card)')}>

                    {/* Capa */}
                    <div style={{ width: 120, height: 90, flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {temCapa
                        ? <img src={m.capa_url!} alt={m.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : capaDefault
                          ? <img src={capaDefault} alt="capa padrão" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 36 }}>📚</span>}
                      <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 700 }}>
                        Módulo {m.ordem}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, padding: '16px 20px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--avp-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.titulo}</h3>
                        {!m.publicado && <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Rascunho</span>}
                      </div>
                      {m.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descricao}</p>}
                      {/* Badges de perfis permitidos */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(m.perfis_permitidos ?? ['consultor', 'gestor']).length === 0
                          ? <span style={{ fontSize: 11, color: 'var(--avp-danger)', fontWeight: 600 }}>🚫 Nenhum perfil — módulo invisível</span>
                          : (m.perfis_permitidos ?? ['consultor', 'gestor']).map(pid => {
                              const perf = PERFIS.find(p => p.id === pid)
                              if (!perf) return null
                              return <span key={pid} style={{ background: perf.bg, color: perf.cor, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{perf.label}</span>
                            })}
                      </div>
                    </div>

                    {/* CTA */}
                    <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      📋 Ver aulas
                      <span style={{ fontSize: 20 }}>›</span>
                    </div>
                  </Link>

                  {/* Ações secundárias */}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--avp-border)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.15)' }}>
                    <button onClick={() => abrirEdicao(m)}
                      style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => togglePublicado(m)}
                      style={{ background: m.publicado ? 'var(--avp-border)' : 'var(--avp-green)', color: m.publicado ? 'var(--avp-text-dim)' : '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {m.publicado ? '🙈 Despublicar' : '✅ Publicar'}
                    </button>
                    <button onClick={() => excluirModulo(m)}
                      style={{ background: 'none', border: '1px solid var(--avp-danger)', color: 'var(--avp-danger)', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {modulos.length === 0 && !criando && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>Nenhum módulo cadastrado.</div>
        )}
      </div>
    </div>
  )
}
