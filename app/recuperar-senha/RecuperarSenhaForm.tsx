'use client'
import { useState, useEffect } from 'react'

export default function RecuperarSenhaForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Countdown do cooldown para reenvio
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function enviar() {
    if (!email || loading) return
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro('Erro ao enviar. Tente novamente.'); setLoading(false); return }
      setEnviado(true)
      setCooldown(60)
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    }
    setLoading(false)
  }

  async function reenviar() {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setErro('')
    try {
      await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }),
      })
      setCooldown(60)
    } catch {
      setErro('Erro ao reenviar. Tente novamente.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && (
            <img src={logoUrl} className="logo-site" alt="Logo"
              style={{ height: 72, objectFit: 'contain', marginBottom: 14 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          {siteNome && (
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>
          )}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>

          {!enviado ? (
            /* ── FORMULÁRIO ── */
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Recuperar senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
                  {erro}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviar()}
                    style={inp}
                  />
                </div>
                <button
                  onClick={enviar}
                  disabled={loading || !email}
                  style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading || !email ? 'not-allowed' : 'pointer', opacity: loading || !email ? 0.7 : 1 }}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </div>
            </>
          ) : (
            /* ── E-MAIL ENVIADO ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>E-mail enviado!</h2>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.7 }}>
                  Enviamos um link de recuperação para<br />
                  <strong style={{ color: 'var(--avp-text)' }}>{email}</strong>
                </p>
              </div>

              {/* Dica sobre spam */}
              <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>
                  <strong>Não encontrou o e-mail?</strong><br />
                  Verifique a pasta de <strong>Spam</strong> ou <strong>Lixo eletrônico</strong>. O link expira em 1 hora.
                </p>
              </div>

              {/* Botão reenviar com cooldown */}
              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 12 }}>
                  {erro}
                </div>
              )}
              <button
                onClick={reenviar}
                disabled={cooldown > 0 || loading}
                style={{
                  width: '100%', background: cooldown > 0 ? 'var(--avp-border)' : 'var(--avp-card)',
                  color: cooldown > 0 ? 'var(--avp-text-dim)' : 'var(--avp-text)',
                  border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px',
                  fontWeight: 600, fontSize: 14, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}>
                {loading ? 'Reenviando...' : cooldown > 0 ? `🔄 Reenviar e-mail (${cooldown}s)` : '🔄 Reenviar e-mail'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  onClick={() => { setEnviado(false); setEmail(''); setCooldown(0) }}
                  style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                  Usar outro e-mail
                </button>
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--avp-text-dim)' }}>
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>
              ← Voltar ao login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
