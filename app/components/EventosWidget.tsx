'use client'
import { useEffect, useState } from 'react'

type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string; imagem_url?: string }

export default function EventosWidget() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [aberto, setAberto] = useState(false)
  const [popup, setPopup] = useState<Evento | null>(null)

  useEffect(() => {
    fetch('/api/eventos').then(r => r.json()).then((data: Evento[]) => {
      const agora = new Date()
      const futuros = data.filter(e => new Date(e.data_hora) >= agora)
      setEventos(futuros)

      // Popup automático: evento com imagem faltando ≤ 10 dias, não dispensado nesta sessão
      const chave = 'eventos_popup_visto'
      const vistos: string[] = JSON.parse(sessionStorage.getItem(chave) || '[]')
      const proximo = futuros.find(e => {
        const diasRestantes = (new Date(e.data_hora).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
        return diasRestantes <= 10 && e.imagem_url && !vistos.includes(e.id)
      })
      if (proximo) setPopup(proximo)
    }).catch(() => {})
  }, [])

  function fecharPopup() {
    if (!popup) return
    const chave = 'eventos_popup_visto'
    const vistos: string[] = JSON.parse(sessionStorage.getItem(chave) || '[]')
    sessionStorage.setItem(chave, JSON.stringify([...vistos, popup.id]))
    setPopup(null)
  }

  return (
    <>
      {/* Popup automático de evento próximo */}
      {popup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={fecharPopup}>
          <div style={{ background: 'var(--avp-card)', borderRadius: 16, overflow: 'hidden', maxWidth: 440, width: '100%', boxShadow: '0 16px 64px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}>
            {popup.imagem_url && (
              <img src={popup.imagem_url} alt={popup.titulo}
                style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: 'var(--grad-brand)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>
                  🗓️ EVENTO EM BREVE
                </span>
              </div>
              <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{popup.titulo}</p>
              <p style={{ fontSize: 14, color: 'var(--avp-text-dim)', marginBottom: 4 }}>
                📅 {new Date(popup.data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} às {new Date(popup.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {popup.cidade && <p style={{ fontSize: 14, color: 'var(--avp-text-dim)', marginBottom: 4 }}>📍 {popup.cidade}</p>}
              {popup.descricao && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginTop: 8 }}>{popup.descricao}</p>}
              <button onClick={fecharPopup}
                style={{ marginTop: 16, width: '100%', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                OK, entendi!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão do widget */}
      {eventos.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => setAberto(p => !p)}
            style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '6px 14px', color: 'var(--avp-text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            🗓️ Eventos
            <span style={{ background: 'var(--grad-brand)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
              {eventos.length}
            </span>
          </button>

          {aberto && (
            <>
              <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 50, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 16, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Próximos Eventos</p>
                {eventos.slice(0, 8).map(e => {
                  const dt = new Date(e.data_hora)
                  const temImagem = e.imagem_url?.startsWith('data:') || e.imagem_url?.startsWith('blob:')
                  return (
                    <div key={e.id} style={{ background: 'var(--avp-black)', borderRadius: 10, overflow: 'hidden' }}>
                      {temImagem && (
                        <img src={e.imagem_url} alt={e.titulo} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                      )}
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{e.titulo}</p>
                        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 2 }}>
                          📅 {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {e.cidade && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>📍 {e.cidade}</p>}
                        {e.descricao && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 4 }}>{e.descricao}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
