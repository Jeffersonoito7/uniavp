'use client'
import { useEffect, useState } from 'react'

type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }

export default function EventosWidget() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    fetch('/api/eventos').then(r => r.json()).then(data => {
      const futuros = (data as Evento[]).filter(e => new Date(e.data_hora) >= new Date())
      setEventos(futuros)
    }).catch(() => {})
  }, [])

  if (eventos.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(p => !p)}
        style={{
          background: 'var(--avp-card)',
          border: '1px solid var(--avp-border)',
          borderRadius: 8,
          padding: '6px 14px',
          color: 'var(--avp-text)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        🗓️ Eventos
        <span style={{ background: 'var(--grad-brand)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
          {eventos.length}
        </span>
      </button>

      {aberto && (
        <>
          <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 50,
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
            borderRadius: 12, padding: 16, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Próximos Eventos</p>
            {eventos.slice(0, 8).map(e => {
              const dt = new Date(e.data_hora)
              return (
                <div key={e.id} style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{e.titulo}</p>
                  <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 2 }}>
                    📅 {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {e.cidade && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>📍 {e.cidade}</p>}
                  {e.descricao && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 6 }}>{e.descricao}</p>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
