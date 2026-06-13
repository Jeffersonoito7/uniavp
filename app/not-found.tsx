export default function NotFound() {
 return (
 <div className="page-wrap" style={{ textAlign: 'center' }}>
 <div style={{ maxWidth: 440 }}>
 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--avp-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}>
 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
 </svg>
 <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Página não encontrada</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
 O link que você acessou não existe ou foi movido.
 </p>
 <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
 <a href="/entrar" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: 15 }}>
 Entrar na plataforma
 </a>
 <a href="/captacao" className="btn btn-ghost" style={{ textDecoration: 'none', fontSize: 15 }}>
 Conhecer a plataforma
 </a>
 </div>
 </div>
 </div>
 )
}
