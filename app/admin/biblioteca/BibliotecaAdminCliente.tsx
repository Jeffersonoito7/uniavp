'use client'
import { useState } from 'react'

type Item = {
  id: string
  titulo: string
  autor: string | null
  descricao: string | null
  url: string
  tipo: string | null
  capa_url: string | null
  categoria: string | null
  plano: string | null
  duracao: string | null
  ordem: number | null
  ativo: boolean | null
}

const CATEGORIAS = ['Audiobook', 'Podcast', 'Vendas', 'Mentalidade', 'Liderança', 'Finanças', 'Negócios', 'Motivação']
const TIPOS = [
  { value: 'drive', label: 'Google Drive (áudio)' },
  { value: 'youtube', label: 'YouTube (vídeo)' },
  { value: 'audio', label: 'Link direto MP3' },
]

const EMPTY = { titulo: '', autor: '', descricao: '', url: '', tipo: 'drive', capa_url: '', categoria: 'Audiobook', plano: 'pro', duracao: '', ordem: 0 }

const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
const inp = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 16, outline: 'none', boxSizing: 'border-box' as const }
const lbl = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

export default function BibliotecaAdminCliente({ inicial }: { inicial: Item[] }) {
  const [items, setItems] = useState<Item[]>(inicial)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editando, setEditando] = useState<string | null>(null)
  const [abrindo, setAbrindo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  function abrirNovo() { setForm(EMPTY); setEditando(null); setAbrindo(true) }
  function abrirEdicao(item: Item) {
    setForm({ titulo: item.titulo, autor: item.autor || '', descricao: item.descricao || '', url: item.url, tipo: item.tipo || 'drive', capa_url: item.capa_url || '', categoria: item.categoria || 'Audiobook', plano: item.plano || 'pro', duracao: item.duracao || '', ordem: item.ordem ?? 0 })
    setEditando(item.id)
    setAbrindo(true)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const body = editando ? { ...form, id: editando } : form
    const method = editando ? 'PUT' : 'POST'
    const res = await fetch('/api/admin/biblioteca', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.item) {
      if (editando) setItems(prev => prev.map(i => i.id === editando ? data.item : i))
      else setItems(prev => [data.item, ...prev])
      setAbrindo(false)
      setEditando(null)
    }
    setSalvando(false)
  }

  async function toggleAtivo(item: Item) {
    const res = await fetch('/api/admin/biblioteca', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, ativo: !item.ativo }) })
    const data = await res.json()
    if (data.item) setItems(prev => prev.map(i => i.id === item.id ? data.item : i))
  }

  async function deletar(id: string) {
    if (!confirm('Remover este item?')) return
    await fetch('/api/admin/biblioteca', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>{items.length} item(s)</span>
        <button onClick={abrirNovo} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          + Adicionar
        </button>
      </div>

      {abrindo && (
        <form onSubmit={salvar} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{editando ? 'Editar' : 'Novo'} Item</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label style={lbl}>Título *</label>
              <input style={inp} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Autor</label>
              <input style={inp} value={form.autor} onChange={e => setForm(p => ({ ...p, autor: e.target.value }))} placeholder="Ex: Napoleon Hill" />
            </div>
          </div>

          <div>
            <label style={lbl}>URL do conteúdo *</label>
            <input style={inp} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="Link do Google Drive, YouTube ou MP3" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo</label>
              <select style={{ ...inp }} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Categoria</label>
              <select style={{ ...inp }} value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Acesso</label>
              <select style={{ ...inp }} value={form.plano} onChange={e => setForm(p => ({ ...p, plano: e.target.value }))}>
                <option value="pro">PRO</option>
                <option value="free">FREE</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Duração</label>
              <input style={inp} value={form.duracao} onChange={e => setForm(p => ({ ...p, duracao: e.target.value }))} placeholder="Ex: 3h 42min" />
            </div>
          </div>

          <div>
            <label style={lbl}>URL da capa (imagem)</label>
            <input style={inp} value={form.capa_url} onChange={e => setForm(p => ({ ...p, capa_url: e.target.value }))} placeholder="https://..." />
          </div>

          <div>
            <label style={lbl}>Descrição</label>
            <textarea style={{ ...inp, minHeight: 72, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setAbrindo(false)} style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => (
          <div key={item.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16, opacity: item.ativo ? 1 : 0.5 }}>
            {item.capa_url ? (
              <img src={item.capa_url} alt={item.titulo} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 8, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>
                {item.tipo === 'youtube' ? '▶' : '🎧'}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.titulo}</span>
                <span style={{ background: item.plano === 'pro' ? 'rgba(79,70,229,0.15)' : 'rgba(34,197,94,0.15)', color: item.plano === 'pro' ? '#818cf8' : '#22c55e', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                  {(item.plano || 'pro').toUpperCase()}
                </span>
                <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{item.categoria}</span>
              </div>
              {item.autor && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '2px 0 0' }}>{item.autor}</p>}
              {item.duracao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, margin: 0 }}>{item.duracao}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => toggleAtivo(item)} style={{ background: item.ativo ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: item.ativo ? '#22c55e' : '#ef4444', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => abrirEdicao(item)} style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                Editar
              </button>
              <button onClick={() => deletar(item.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                Remover
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && !abrindo && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🎧</p>
            <p>Nenhum item cadastrado. Clique em "+ Adicionar" para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
