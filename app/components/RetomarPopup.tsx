'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Props = {
  whatsapp: string
  aulaId: string
  aulaId_titulo: string
  moduloTitulo: string
  descricao: string | null
  thumbUrl: string | null
  totalModulos: number
  totalAulas: number
}

export default function RetomarPopup({ whatsapp, aulaId, aulaId_titulo, moduloTitulo, descricao, thumbUrl, totalModulos, totalAulas }: Props) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const chave = `retomar_visto_${aulaId}`
    if (!sessionStorage.getItem(chave)) {
      setVisivel(true)
    }
  }, [aulaId])

  function fechar() {
    sessionStorage.setItem(`retomar_visto_${aulaId}`, '1')
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && fechar()}>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 18, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>

        {/* Thumbnail com overlay */}
        <div style={{ height: 220, position: 'relative', background: 'linear-gradient(135deg, #1e3a8a, #166534)', overflow: 'hidden' }}>
          {thumbUrl && <img src={thumbUrl} alt={aulaId_titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.2) 100%)' }} />

          {/* Fechar */}
          <button onClick={fechar} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>×</button>

          {/* Info sobre o módulo */}
          <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px' }}>{moduloTitulo}</p>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{aulaId_titulo}</h2>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {descricao && (
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {descricao}
            </p>
          )}

          <Link href={`/aluno/${whatsapp}/aula/${aulaId}`} onClick={fechar}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 16 }}>
            <span style={{ fontSize: 20 }}>▶</span> Retomar
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--avp-border)' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0, fontWeight: 600 }}>
              {totalModulos} módulo{totalModulos !== 1 ? 's' : ''} · {totalAulas} aula{totalAulas !== 1 ? 's' : ''}
            </p>
            <button onClick={fechar} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
              Ver todos os módulos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
