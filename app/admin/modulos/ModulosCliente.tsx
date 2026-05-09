'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'

type Modulo = {
  id: string
  titulo: string
  descricao: string | null
  capa_url: string | null
  ordem: number
  publicado: boolean
}

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

  function selecionarCapa(file: File) {
    if (file.size > 3 * 1024 * 1024) { setMsg({ tipo: 'err', texto: 'Imagem muito grande. Use até 3MB.' }); return }
    setUploadando(true)
    setCapaPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = ev => { setCapaBase64(ev.target?.result as string); setUploadando(false) }
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
      setMsg({ tipo: 'ok', texto: 'Módulo criado com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar módulo.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  const cardStyle: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

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
        <form onSubmit={criarModulo} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)' }}>Novo Módulo</h3>

          <div>
            <label style={labelStyle}>Título *</label>
            <input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required placeholder="Nome do módulo" />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <input style={inputStyle} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição opcional" />
          </div>

          {/* Capa do módulo */}
          <div>
            <label style={labelStyle}>Capa do módulo <span style={{ color: 'var(--avp-green)', fontSize: 11, fontWeight: 700 }}>📐 1380 × 1080 px</span></label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width: 138, height: 108, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: `2px dashed ${capaPreview ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: 'var(--avp-black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {capaPreview
                  ? <img src={capaPreview} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'var(--avp-text-dim)', fontSize: 28 }}>🖼️</span>
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) selecionarCapa(f); e.target.value = '' }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadando}
                  style={{ background: capaPreview ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: uploadando ? 0.7 : 1 }}>
                  {uploadando ? '⏳ Lendo...' : capaPreview ? '🔄 Trocar capa' : '📤 Subir capa'}
                </button>
                {capaPreview && (
                  <button type="button" onClick={() => { setCapaPreview(null); setCapaBase64(null) }}
                    style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                    Remover
                  </button>
                )}
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', lineHeight: 1.4 }}>PNG ou JPG · ideal 1380×1080px · máx. 3MB</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={salvando || uploadando}
            style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Criando...' : 'Criar Módulo'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modulos.sort((a, b) => a.ordem - b.ordem).map(m => {
          const temCapa = m.capa_url?.startsWith('data:') || m.capa_url?.startsWith('blob:')
          return (
            <div key={m.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
              {temCapa && (
                <img src={m.capa_url!} alt={m.titulo}
                  style={{ width: 80, height: 62, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <Link href={`/admin/modulos/${m.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>Módulo {m.ordem}</span>
                    <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)' }}>{m.titulo}</h3>
                  </div>
                  {m.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>{m.descricao}</p>}
                </div>
              </Link>
              <button
                onClick={async () => {
                  const res = await fetch('/api/admin/modulos', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: m.id, publicado: !m.publicado }),
                  })
                  const data = await res.json()
                  if (data.modulo) setModulos(prev => prev.map(mod => mod.id === m.id ? { ...mod, publicado: !mod.publicado } : mod))
                }}
                style={{ background: m.publicado ? 'var(--avp-border)' : 'var(--avp-green)', color: m.publicado ? 'var(--avp-text-dim)' : '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
              >
                {m.publicado ? 'Despublicar' : 'Publicar'}
              </button>
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
