'use client'
import { useEffect, useState } from 'react'

type Noticia = { id: string; titulo: string; conteudo: string; imagem_url: string; created_at: string }

export default function MuralNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    fetch('/api/noticias').then(r => r.json()).then(setNoticias).catch(() => {})
  }, [])

  if (noticias.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(p => !p)}
        style={{
          background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          color: 'var(--avp-text)', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        📢 Notícias
        <span style={{ background: 'var(--grad-brand)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
          {noticias.length}
        </span>
      </button>

      {aberto && (
        <>
          <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 50,
            background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
            borderRadius: 12, padding: 16, width: 340,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflowY: 'auto',
          }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>📢 Mural de Notícias</p>
            {noticias.map(n => (
              <div key={n.id} style={{ background: 'var(--avp-black)', borderRadius: 10, overflow: 'hidden' }}>
                {n.imagem_url && (
                  <img src={n.imagem_url} alt={n.titulo}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{n.titulo}</p>
                  {n.conteudo && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.5 }}>{n.conteudo}</p>}
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6 }}>
                    {new Date(n.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
