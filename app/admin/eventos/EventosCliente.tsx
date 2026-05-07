'use client'
import { useState } from 'react'

type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }

export default function EventosCliente({ inicial }: { inicial: Evento[] }) {
  const [eventos, setEventos] = useState<Evento[]>(inicial)
  const [form, setForm] = useState({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: false })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  async function criar() {
    if (!form.titulo || !form.data_hora) { setMsg('Preencha título e data.'); return }
    setSalvando(true); setMsg('')
    const res = await fetch('/api/admin/eventos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const novo = await res.json()
      setEventos(prev => [...prev, novo].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()))
      setForm({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: false })
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32 }}>
      {/* Formulário */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start' }}>
        <p style={{ fontWeight: 700, fontSize: 15 }}>Novo Evento</p>
        <div><label style={labelStyle}>Título *</label><input style={inputStyle} value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Nome do evento" /></div>
        <div><label style={labelStyle}>Data e Hora *</label><input type="datetime-local" style={inputStyle} value={form.data_hora} onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))} /></div>
        <div><label style={labelStyle}>Cidade</label><input style={inputStyle} value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} placeholder="Ex: Petrolina - PE" /></div>
        <div><label style={labelStyle}>Descrição</label><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes do evento..." /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="notificar" checked={form.notificar} onChange={e => setForm(p => ({ ...p, notificar: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)', cursor: 'pointer' }} />
          <label htmlFor="notificar" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer', fontSize: 13 }}>Notificar consultores via WhatsApp</label>
        </div>
        {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)' }}>{msg}</p>}
        <button onClick={criar} disabled={salvando} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
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

function EventoCard({ e, onDelete, futuro }: { e: { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }; onDelete: (id: string) => void; futuro: boolean }) {
  const dt = new Date(e.data_hora)
  return (
    <div style={{ background: 'var(--avp-card)', border: `1px solid ${futuro ? 'var(--avp-border)' : 'var(--avp-border)'}`, borderRadius: 12, padding: '16px 20px', opacity: futuro ? 1 : 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
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
  )
}
