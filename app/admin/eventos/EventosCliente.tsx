'use client'
import { useRef, useState } from 'react'

type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string; imagem_url?: string }

export default function EventosCliente({ inicial }: { inicial: Evento[] }) {
  const [eventos, setEventos] = useState<Evento[]>(inicial)
  const [form, setForm] = useState({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: false })
  const [imagem, setImagem] = useState<string | null>(null) // blob URL para preview
  const [imagemBase64, setImagemBase64] = useState<string | null>(null) // base64 para salvar
  const [formato, setFormato] = useState<'feed' | 'stories'>('feed')
  const [uploadando, setUploadando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  function selecionarImagem(file: File) {
    if (file.size > 5 * 1024 * 1024) { setMsg('❌ Imagem muito grande. Use até 5MB.'); return }
    setUploadando(true)
    setImagem(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = ev => { setImagemBase64(ev.target?.result as string); setUploadando(false) }
    reader.onerror = () => { setMsg('❌ Erro ao ler imagem'); setUploadando(false) }
    reader.readAsDataURL(file)
  }

  async function criar() {
    if (!form.titulo || !form.data_hora) { setMsg('Preencha título e data.'); return }
    setSalvando(true); setMsg('')
    const res = await fetch('/api/admin/eventos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imagem_url: imagemBase64 || '' }),
    })
    if (res.ok) {
      const novo = await res.json()
      setEventos(prev => [...prev, novo].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()))
      setForm({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: false })
      setImagem(null); setImagemBase64(null)
      setMsg(form.notificar ? 'Evento criado e consultores notificados!' : 'Evento criado!')
    } else {
      setMsg('Erro ao criar evento.')
    }
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch('/api/admin/eventos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const passados = eventos.filter(e => new Date(e.data_hora) < new Date())
  const futuros = eventos.filter(e => new Date(e.data_hora) >= new Date())

  const formatoInfo = formato === 'feed'
    ? { label: 'Feed', dims: '1080 × 1080 px', aspect: '1 / 1' }
    : { label: 'Stories', dims: '1080 × 1920 px', aspect: '9 / 16' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32 }}>
      {/* Formulário */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start' }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Novo Evento</p>

        <div><label style={labelStyle}>Título *</label><input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Nome do evento" /></div>
        <div><label style={labelStyle}>Data e Hora *</label><input type="datetime-local" style={inputStyle} value={form.data_hora} onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))} /></div>
        <div><label style={labelStyle}>Cidade</label><input style={inputStyle} value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Ex: Petrolina - PE" /></div>
        <div><label style={labelStyle}>Descrição</label><textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes do evento..." /></div>

        {/* Upload de imagem */}
        <div>
          <label style={labelStyle}>Imagem do evento</label>

          {/* Seletor de formato */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['feed', 'stories'] as const).map(f => (
              <button key={f} onClick={() => setFormato(f)} style={{
                flex: 1, padding: '7px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                background: formato === f ? 'var(--grad-brand)' : 'var(--avp-black)',
                border: `1px solid ${formato === f ? 'transparent' : 'var(--avp-border)'}`,
                color: formato === f ? '#fff' : 'var(--avp-text-dim)',
              }}>
                {f === 'feed' ? '🖼️ Feed (1080×1080)' : '📱 Stories (1080×1920)'}
              </button>
            ))}
          </div>

          {/* Preview / drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: `2px dashed ${imagem ? 'var(--avp-green)' : 'var(--avp-border)'}`,
              background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              aspectRatio: formatoInfo.aspect, width: '100%', maxHeight: 240, position: 'relative',
            }}
          >
            {imagem ? (
              <img src={imagem} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ fontSize: 28, marginBottom: 6 }}>🖼️</p>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>{formatoInfo.dims}</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Clique para selecionar</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) selecionarImagem(f); e.target.value = '' }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => fileRef.current?.click()} disabled={uploadando}
              style={{ flex: 1, background: imagem ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: uploadando ? 0.7 : 1 }}>
              {uploadando ? '⏳ Lendo...' : imagem ? '🔄 Trocar imagem' : '📤 Subir imagem'}
            </button>
            {imagem && (
              <button onClick={() => { setImagem(null); setImagemBase64(null) }}
                style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--avp-text-dim)' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="notificar" checked={form.notificar} onChange={e => setForm(p => ({ ...p, notificar: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)', cursor: 'pointer' }} />
          <label htmlFor="notificar" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', fontSize: 13 }}>Notificar consultores via WhatsApp</label>
        </div>

        {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') || msg.includes('❌') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>}

        <button onClick={criar} disabled={salvando || uploadando} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
          {salvando ? 'Criando...' : 'Criar Evento'}
        </button>
      </div>

      {/* Lista */}
      <div>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Próximos ({futuros.length})</p>
        {futuros.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 24 }}>Nenhum evento futuro cadastrado.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {futuros.map(e => <EventoCard key={e.id} e={e} onDelete={excluir} futuro />)}
        </div>
        {passados.length > 0 && (
          <>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--avp-text-dim)' }}>Histórico ({passados.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {passados.slice(0, 10).map(e => <EventoCard key={e.id} e={e} onDelete={excluir} futuro={false} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EventoCard({ e, onDelete, futuro }: { e: Evento; onDelete: (id: string) => void; futuro: boolean }) {
  const dt = new Date(e.data_hora)
  const temImagem = e.imagem_url?.startsWith('data:') || e.imagem_url?.startsWith('blob:')
  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden', opacity: futuro ? 1 : 0.6 }}>
      {temImagem && (
        <img src={e.imagem_url} alt={e.titulo} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{e.titulo}</p>
          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>
            📅 {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {e.cidade && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>📍 {e.cidade}</p>}
          {e.descricao && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: 4 }}>{e.descricao}</p>}
        </div>
        <button onClick={() => onDelete(e.id)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: 4 }} title="Excluir">✕</button>
      </div>
    </div>
  )
}
