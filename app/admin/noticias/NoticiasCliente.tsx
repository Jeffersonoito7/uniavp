'use client'
import { useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Noticia = { id: string; titulo: string; conteudo: string; imagem_url: string; publicado: boolean; created_at: string }

export default function NoticiasCliente({ inicial }: { inicial: Noticia[] }) {
  const [noticias, setNoticias] = useState<Noticia[]>(inicial)
  const [form, setForm] = useState({ titulo: '', conteudo: '', imagem_url: '' })
  const [salvando, setSalvando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const inputImgRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  async function uploadImagem(file: File) {
    setUploading(true)
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const path = `noticias/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await sb.storage.from('artes').upload(path, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = sb.storage.from('artes').getPublicUrl(path)
      setForm(p => ({ ...p, imagem_url: publicUrl }))
    }
    setUploading(false)
  }

  async function publicar() {
    if (!form.titulo) { setMsg('Informe o título.'); return }
    setSalvando(true); setMsg('')
    const res = await fetch('/api/admin/noticias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const nova = await res.json()
      setNoticias(prev => [nova, ...prev])
      setForm({ titulo: '', conteudo: '', imagem_url: '' })
      setMsg('Notícia publicada!')
    } else setMsg('Erro ao publicar.')
    setSalvando(false)
  }

  async function togglePublicado(n: Noticia) {
    await fetch('/api/admin/noticias', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id, publicado: !n.publicado }) })
    setNoticias(prev => prev.map(x => x.id === n.id ? { ...x, publicado: !x.publicado } : x))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta notícia?')) return
    await fetch('/api/admin/noticias', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNoticias(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32 }}>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start' }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Nova Notícia</p>
        <div><label style={labelStyle}>Título *</label><input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} /></div>
        <div><label style={labelStyle}>Texto</label><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as React.CSSProperties} value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} /></div>
        <div>
          <label style={labelStyle}>Imagem</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={form.imagem_url} onChange={e => setForm(p => ({ ...p, imagem_url: e.target.value }))} placeholder="URL ou faça upload" />
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={inputImgRef} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImagem(f); e.target.value = '' }} />
            <button onClick={() => inputImgRef.current?.click()} disabled={uploading} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {uploading ? '⏳' : '📤'}
            </button>
          </div>
          {form.imagem_url && <img src={form.imagem_url} alt="" style={{ marginTop: 8, width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        </div>
        {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>}
        <button onClick={publicar} disabled={salvando} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {salvando ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Publicadas ({noticias.filter(n => n.publicado).length})</p>
        {noticias.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhuma notícia ainda.</p>}
        {noticias.map(n => (
          <div key={n.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden', opacity: n.publicado ? 1 : 0.5 }}>
            {n.imagem_url && <img src={n.imagem_url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{n.titulo}</p>
                {n.conteudo && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>{n.conteudo.slice(0, 100)}{n.conteudo.length > 100 ? '...' : ''}</p>}
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => togglePublicado(n)} style={{ background: n.publicado ? '#f59e0b20' : '#02A15320', color: n.publicado ? '#f59e0b' : 'var(--avp-green)', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {n.publicado ? 'Despublicar' : 'Publicar'}
                </button>
                <button onClick={() => excluir(n.id)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
