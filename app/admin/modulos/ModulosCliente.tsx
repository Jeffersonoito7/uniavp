'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'

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

type Modulo = {
  id: string
  titulo: string
  descricao: string | null
  capa_url: string | null
  ordem: number
  publicado: boolean
}

type EditForm = { titulo: string; descricao: string; capaPreview: string | null; capaBase64: string | null }

export default function ModulosCliente({ modulosIniciais }: { modulosIniciais: Modulo[] }) {
  const [modulos, setModulos] = useState<Modulo[]>(modulosIniciais)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '' })
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [capaBase64, setCapaBase64] = useState<string | null>(null)
  const [uploadando, setUploadando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Edição
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ titulo: '', descricao: '', capaPreview: null, capaBase64: null })
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

  async function criarModulo(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/admin/modulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: form.titulo, descricao: form.descricao || null, capa_url: capaBase64 || null }),
    })
    const data = await res.json()
    if (data.modulo) {
      setModulos(m => [...m, data.modulo])
      setForm({ titulo: '', descricao: '' })
      setCapaPreview(null); setCapaBase64(null)
      setCriando(false)
      setMsg({ tipo: 'ok', texto: 'Módulo criado!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar módulo.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  function abrirEdicao(m: Modulo) {
    setEditandoId(m.id)
    const temCapa = m.capa_url?.startsWith('data:') || m.capa_url?.startsWith('blob:')
    setEditForm({ titulo: m.titulo, descricao: m.descricao ?? '', capaPreview: temCapa ? m.capa_url : null, capaBase64: temCapa ? m.capa_url : null })
  }

  async function salvarEdicao(id: string) {
    setSalvandoEdit(true)
    const res = await fetch('/api/admin/modulos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, titulo: editForm.titulo, descricao: editForm.descricao || null, capa_url: editForm.capaBase64 || null }),
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
            <div key={m.id} style={card}>
              {isEditing ? (
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
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  {temCapa && <img src={m.capa_url!} alt={m.titulo} style={{ width: 80, height: 62, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                  <Link href={`/admin/modulos/${m.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>Módulo {m.ordem}</span>
                      <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)' }}>{m.titulo}</h3>
                    </div>
                    {m.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>{m.descricao}</p>}
                  </Link>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button onClick={() => abrirEdicao(m)}
                      style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => togglePublicado(m)}
                      style={{ background: m.publicado ? 'var(--avp-border)' : 'var(--avp-green)', color: m.publicado ? 'var(--avp-text-dim)' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {m.publicado ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button onClick={() => excluirModulo(m)}
                      style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Excluir
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
