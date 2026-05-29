'use client'
import { useState } from 'react'
import Link from 'next/link'

type Item = {
  id: string
  titulo: string
  autor: string | null
  descricao: string | null
  url: string
  tipo: string
  capa_url: string | null
  categoria: string | null
  plano: string
  duracao: string | null
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return m?.[1] ?? null
}

function getDriveId(url: string) {
  const m = url.match(/\/d\/([^/?]+)/) || url.match(/id=([^&]+)/)
  return m?.[1] ?? null
}

function Player({ item }: { item: Item }) {
  if (item.tipo === 'youtube') {
    const id = getYouTubeId(item.url)
    if (!id) return <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Link inválido</p>
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', width: '100%' }}>
        <iframe
          width="100%" height="100%"
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen style={{ border: 'none', display: 'block' }}
        />
      </div>
    )
  }
  if (item.tipo === 'drive') {
    const id = getDriveId(item.url)
    if (!id) return <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Link inválido</p>
    return (
      <iframe
        src={`https://drive.google.com/file/d/${id}/preview`}
        width="100%" height="80"
        allow="autoplay"
        style={{ border: 'none', borderRadius: 8, background: '#000' }}
      />
    )
  }
  return (
    <audio controls autoPlay style={{ width: '100%', borderRadius: 8 }}>
      <source src={item.url} />
    </audio>
  )
}

const CATEGORIAS = ['Todos', 'Audiobook', 'Podcast', 'Vendas', 'Mentalidade', 'Liderança', 'Finanças', 'Negócios', 'Motivação']

export default function BibliotecaCliente({ items, whatsapp, alunoNome }: { items: Item[]; whatsapp: string; alunoNome: string }) {
  const [ativo, setAtivo] = useState<Item | null>(null)
  const [cat, setCat] = useState('Todos')

  const filtrados = cat === 'Todos' ? items : items.filter(i => i.categoria === cat)
  const catsDisponiveis = ['Todos', ...Array.from(new Set(items.map(i => i.categoria || 'Audiobook')))]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ background: 'rgba(8,9,13,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--avp-border)', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href={`/aluno/${whatsapp}`} style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14 }}>← Meu Painel</Link>
        <h1 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Biblioteca do Poder</h1>
        <span style={{ fontSize: 14, color: 'var(--avp-text-dim)' }}>{items.length} itens</span>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(79,70,229,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', margin: '0 0 8px', background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Biblioteca do Poder
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
            Audiobooks e podcasts selecionados para acelerar sua evolução
          </p>
        </div>
      </div>

      {/* Player fixo */}
      {ativo && (
        <div style={{ background: 'rgba(10,12,20,0.98)', borderBottom: '1px solid var(--avp-border)', padding: '16px 24px', position: 'sticky', top: 62, zIndex: 40 }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ativo.titulo}</p>
                {ativo.autor && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, margin: 0 }}>{ativo.autor}</p>}
              </div>
              <button onClick={() => setAtivo(null)} style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 6, padding: '4px 10px', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 12, flexShrink: 0, marginLeft: 12 }}>
                Fechar
              </button>
            </div>
            <Player item={ativo} />
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Filtro de categorias */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {catsDisponiveis.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: cat === c ? 'var(--avp-blue)' : 'var(--avp-card)', color: cat === c ? '#fff' : 'var(--avp-text-dim)', border: `1px solid ${cat === c ? 'transparent' : 'var(--avp-border)'}`, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid de cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtrados.map(item => (
            <button key={item.id} onClick={() => setAtivo(item)}
              style={{ background: ativo?.id === item.id ? 'rgba(79,70,229,0.15)' : 'var(--avp-card)', border: `1px solid ${ativo?.id === item.id ? 'rgba(79,70,229,0.5)' : 'var(--avp-border)'}`, borderRadius: 14, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column' }}>

              {/* Capa */}
              <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {item.capa_url ? (
                  <img src={item.capa_url} alt={item.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 48 }}>{item.tipo === 'youtube' ? '▶' : '🎧'}</span>
                )}
                {/* Badge plano */}
                <span style={{ position: 'absolute', top: 8, right: 8, background: item.plano === 'pro' ? 'rgba(79,70,229,0.9)' : 'rgba(34,197,94,0.9)', color: '#fff', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                  {item.plano.toUpperCase()}
                </span>
                {/* Ícone play */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1') }
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0') }>
                  <div style={{ width: 48, height: 48, background: 'rgba(79,70,229,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px 14px' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--avp-text)', margin: '0 0 3px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.titulo}
                </p>
                {item.autor && <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, margin: '0 0 4px' }}>{item.autor}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {item.categoria && <span style={{ background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{item.categoria}</span>}
                  {item.duracao && <span style={{ color: 'var(--avp-text-dim)', fontSize: 10 }}>{item.duracao}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--avp-text-dim)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📚</p>
            <p>Nenhum item encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
