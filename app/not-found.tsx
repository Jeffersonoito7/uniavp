export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9',
      fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 440 }}>
        <p style={{ fontSize: 80, marginBottom: 8, lineHeight: 1 }}>🔍</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Página não encontrada</h1>
        <p style={{ color: 'rgba(241,245,249,0.5)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
          O link que você acessou não existe ou foi movido.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/entrar" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Entrar na plataforma
          </a>
          <a href="/captacao" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9', borderRadius: 10, padding: '12px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Conhecer a plataforma
          </a>
        </div>
      </div>
    </div>
  )
}
