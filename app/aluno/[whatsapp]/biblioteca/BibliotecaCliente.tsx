'use client'
import { useState } from 'react'
import Link from 'next/link'

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
 if (!id) return <p style={{ color: '#888', fontSize: 13 }}>Link inválido</p>
 return (
 <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', width: '100%' }}>
 <iframe width="100%" height="100%"
 src={`https://www.youtube.com/embed/${id}?autoplay=1`}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen style={{ border: 'none', display: 'block' }} />
 </div>
 )
 }
 if (item.tipo === 'drive') {
 const id = getDriveId(item.url)
 if (!id) return <p style={{ color: '#888', fontSize: 13 }}>Link inválido</p>
 return (
 <iframe src={`https://drive.google.com/file/d/${id}/preview`}
 width="100%" height="72" allow="autoplay"
 style={{ border: 'none', borderRadius: 8, background: '#000', display: 'block' }} />
 )
 }
 return (
 <audio controls autoPlay style={{ width: '100%', borderRadius: 8, height: 40 }}>
 <source src={item.url} />
 </audio>
 )
}

function TipoIcon({ tipo }: { tipo: string | null }) {
 if (tipo === 'youtube') return (
 <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4444">
 <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.3 3 12 3 12 3s-4.3 0-6.8.9c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.6 12 22 12 22s4.3 0 6.8-.6c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.4l6.6 3.6-6.6 3.5z"/>
 </svg>
 )
 if (tipo === 'drive') return (
 <svg width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa">
 <path d="M12 3C6.5 3 2 7.5 2 13c0 5.5 4.5 10 10 10s10-4.5 10-10C22 7.5 17.5 3 12 3zm-2 14.5v-9l7 4.5-7 4.5z"/>
 </svg>
 )
 return (
 <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e">
 <path d="M12 3v10.6c-.5-.3-1-.4-1.5-.4C8.6 13.2 7 14.8 7 17s1.6 3.8 3.5 3.8S14 19.2 14 17V7h4V3h-6z"/>
 </svg>
 )
}

function CapaCard({ item, ativo, onClick }: { item: Item; ativo: boolean; onClick: () => void }) {
 const [hover, setHover] = useState(false)

 return (
 <button
 onClick={onClick}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
 display: 'flex', flexDirection: 'column',
 transform: hover ? 'scale(1.04)' : 'scale(1)',
 transition: 'transform 0.2s ease',
 }}
>
 <div style={{
 width: '100%', aspectRatio: '2/3', borderRadius: 10, position: 'relative', overflow: 'hidden',
 background: item.capa_url
 ? `url(${item.capa_url}) center/cover`
 : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
 boxShadow: ativo
 ? '0 0 0 2px #a78bfa, 0 12px 40px rgba(139,92,246,0.45)'
 : hover ? '0 12px 40px rgba(0,0,0,0.65)' : '0 4px 16px rgba(0,0,0,0.35)',
 transition: 'box-shadow 0.2s ease',
 }}>
 {!item.capa_url && (
 <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 10px' }}>
 <TipoIcon tipo={item.tipo} />
 <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3 }}>{item.titulo}</span>
 </div>
 )}
 {/* Overlay hover/ativo */}
 <div style={{
 position: 'absolute', inset: 0,
 background: hover || ativo ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0)',
 transition: 'background 0.2s',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 }}>
 {(hover || ativo) && (
 <div style={{
 width: 44, height: 44, borderRadius: '50%',
 background: ativo ? '#a78bfa' : 'rgba(255,255,255,0.92)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
 }}>
 {ativo
 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
 : <svg width="14" height="14" viewBox="0 0 24 24" fill="#111"><polygon points="5 3 19 12 5 21 5 3"/></svg>
 }
 </div>
 )}
 </div>
 {/* Badge plano */}
 <span style={{
 position: 'absolute', top: 8, right: 8,
 background: item.plano === 'pro' ? 'rgba(139,92,246,0.92)' : 'rgba(34,197,94,0.92)',
 color: '#fff', borderRadius: 5, padding: '2px 6px', fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
 }}>
 {(item.plano ?? 'pro').toUpperCase()}
 </span>
 {/* Ícone tipo */}
 <span style={{ position: 'absolute', top: 8, left: 8 }}>
 <TipoIcon tipo={item.tipo} />
 </span>
 {/* Gradiente base inferior */}
 <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
 </div>

 <div style={{ paddingTop: 10, paddingBottom: 4 }}>
 <p style={{
 fontWeight: 700, fontSize: 12.5,
 color: ativo ? '#c4b5fd' : '#e5e7eb',
 margin: '0 0 2px', lineHeight: 1.3,
 display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
 }}>
 {item.titulo}
 </p>
 {item.autor && (
 <p style={{ color: '#6b7280', fontSize: 11, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
 {item.autor}
 </p>
 )}
 {item.duracao && (
 <p style={{ color: '#4b5563', fontSize: 10, margin: '2px 0 0' }}>{item.duracao}</p>
 )}
 </div>
 </button>
 )
}

function Secao({ titulo, items, ativo, onSelect }: {
 titulo: string; items: Item[]; ativo: Item | null; onSelect: (i: Item) => void
}) {
 if (items.length === 0) return null
 return (
 <div style={{ marginBottom: 44 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
 <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: '-0.3px' }}>{titulo}</h3>
 <span style={{ color: '#374151', fontSize: 12 }}>{items.length}</span>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 18 }}>
 {items.map(item => (
 <CapaCard key={item.id} item={item} ativo={ativo?.id === item.id} onClick={() => onSelect(item)} />
 ))}
 </div>
 </div>
 )
}

export default function BibliotecaCliente({ items, whatsapp }: { items: Item[]; whatsapp: string; alunoNome: string }) {
 const [ativo, setAtivo] = useState<Item | null>(null)
 const [busca, setBusca] = useState('')

 const filtrados = busca
 ? items.filter(i =>
 i.titulo.toLowerCase().includes(busca.toLowerCase()) ||
 (i.autor || '').toLowerCase().includes(busca.toLowerCase())
 )
 : items

 const cats = Array.from(new Set(items.map(i => i.categoria || 'Geral')))
 const porCategoria = cats.map(cat => ({
 cat,
 items: filtrados.filter(i => (i.categoria || 'Geral') === cat),
 })).filter(g => g.items.length> 0)

 return (
 <div style={{ minHeight: '100dvh', background: '#09090b', color: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

 {/* Header */}
 <header style={{
 background: 'rgba(9,9,11,0.94)', backdropFilter: 'blur(20px)',
 borderBottom: '1px solid rgba(255,255,255,0.07)',
 padding: '0 24px', height: 60,
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 position: 'sticky', top: 0, zIndex: 50,
 }}>
 <Link href={`/aluno/${whatsapp}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
 Painel
 </Link>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
 <span style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
 Biblioteca
 </span>
 </div>
 <span style={{ fontSize: 13, color: '#4b5563' }}>{items.length} títulos</span>
 </header>

 {/* Hero */}
 <div style={{
 background: 'linear-gradient(180deg, rgba(139,92,246,0.1) 0%, transparent 100%)',
 padding: '36px 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)',
 }}>
 <div style={{ maxWidth: 900, margin: '0 auto' }}>
 <p style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, margin: '0 0 6px' }}>
 Acervo exclusivo
 </p>
 <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
 Biblioteca do Poder
 </h2>
 <div style={{ position: 'relative', maxWidth: 360 }}>
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"
 style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
 </svg>
 <input
 value={busca}
 onChange={e => setBusca(e.target.value)}
 placeholder="Buscar título ou autor..."
 style={{
 width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
 borderRadius: 10, padding: '10px 14px 10px 40px', color: '#f9fafb', fontSize: 14,
 outline: 'none', boxSizing: 'border-box' as const,
 }}
 />
 </div>
 </div>
 </div>

 {/* Player */}
 {ativo && (
 <div style={{
 background: 'rgba(15,12,40,0.97)', borderBottom: '1px solid rgba(139,92,246,0.18)',
 padding: '14px 24px', position: 'sticky', top: 60, zIndex: 40,
 backdropFilter: 'blur(20px)',
 }}>
 <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
 {ativo.capa_url && (
 <img src={ativo.capa_url} alt={ativo.titulo}
 style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
 )}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
 <div style={{ minWidth: 0 }}>
 <p style={{ fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e5e7eb' }}>
 {ativo.titulo}
 </p>
 {ativo.autor && <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>{ativo.autor}</p>}
 </div>
 <button onClick={() => setAtivo(null)} style={{
 background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6,
 padding: '5px 12px', color: '#9ca3af', cursor: 'pointer', fontSize: 12,
 flexShrink: 0, marginLeft: 12,
 }}>
 Fechar
 </button>
 </div>
 <Player item={ativo} />
 </div>
 </div>
 </div>
 )}

 {/* Conteúdo */}
 <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 80px' }}>
 {busca ? (
 <>
 <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
 {filtrados.length} resultado(s) para &ldquo;{busca}&rdquo;
 </p>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 18 }}>
 {filtrados.map(item => (
 <CapaCard key={item.id} item={item} ativo={ativo?.id === item.id} onClick={() => setAtivo(item)} />
 ))}
 </div>
 {filtrados.length === 0 && (
 <div style={{ textAlign: 'center', padding: '60px 0', color: '#4b5563' }}>
 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" style={{ marginBottom: 12 }}>
 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
 </svg>
 <p style={{ fontSize: 15 }}>Nenhum resultado para &ldquo;{busca}&rdquo;</p>
 </div>
 )}
 </>
 ) : (
 <>
 {porCategoria.map(({ cat, items: catItems }) => (
 <Secao key={cat} titulo={cat} items={catItems} ativo={ativo} onSelect={setAtivo} />
 ))}
 {items.length === 0 && (
 <div style={{ textAlign: 'center', padding: '80px 0', color: '#4b5563' }}>
 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" style={{ marginBottom: 14 }}>
 <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
 </svg>
 <p style={{ fontSize: 15 }}>Nenhum conteúdo disponível ainda.</p>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 )
}
