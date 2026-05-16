'use client'
import { useState, useEffect } from 'react'

export default function RecuperarSenhaForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function enviar(reenviar = false) {
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
      setEnviado(true)
      setLink(data.link ?? null)
      setCooldown(60)
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 3000)
    return () => clearTimeout(t)
  }, [copiado])

  function copiarLink() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopiado(true)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && (
            <img src={logoUrl} className="logo-site" alt="Logo"
              style={{ height: 72, objectFit: 'contain', marginBottom: 14 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          {siteNome && <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>{siteNome}</h1>}
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {!enviado ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Recuperar senha</h2>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                Digite seu e-mail e gera um link de redefinição.
              </p>
              {erro && (
                <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
                  {erro}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-mail</label>
                  <input type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviar()}
                    style={inp} />
                </div>
                <button onClick={() => enviar()} disabled={loading || !email}
                  style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading || !email ? 'not-allowed' : 'pointer', opacity: loading || !email ? 0.7 : 1 }}>
                  {loading ? 'Gerando link...' : 'Gerar link de recuperação'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Link gerado!</h2>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6 }}>
                  Para <strong style={{ color: 'var(--avp-text)' }}>{email}</strong>
                </p>
              </div>

              {/* Link para copiar */}
              {link && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ background: '#02A15310', border: '1px solid #02A15340', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, color: 'var(--avp-green)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      ✅ Copie e abra no navegador
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                      Copie o link abaixo e cole <strong>no mesmo navegador</strong> onde vai redefinir a senha.
                    </p>
                    <button onClick={copiarLink}
                      style={{ width: '100%', background: copiado ? 'var(--avp-green)' : 'var(--avp-card)', border: `1px solid ${copiado ? 'var(--avp-green)' : 'var(--avp-border)'}`, borderRadius: 8, padding: '10px 14px', color: copiado ? '#fff' : 'var(--avp-text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {copiado ? '✅ Link copiado!' : '📋 Copiar link de redefinição'}
                    </button>
                  </div>

                  {/* Abre direto via JS para evitar pré-fetch do navegador */}
                  <button onClick={() => window.open(link!, '_self')}
                    style={{ width: '100%', background: 'var(--avp-border)', color: 'var(--avp-text)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    🔗 Ou clique aqui para abrir direto
                  </button>
                </div>
              )}

              {/* Se não gerou link, indica e-mail */}
              {!link && (
                <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>
                    📧 Verifique o e-mail de <strong>{email}</strong><br />
                    Também confira a pasta de <strong>Spam</strong>. O link expira em 1 hora.
                  </p>
                </div>
              )}

              <div style={{ background: '#33368710', border: '1px solid #33368730', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.6 }}>
                  ⚠️ <strong>Importante:</strong> O link funciona uma única vez e deve ser aberto no mesmo navegador onde foi gerado.
                </p>
              </div>

              {/* Reenviar */}
              <button onClick={() => { enviar(true) }} disabled={cooldown > 0 || loading}
                style={{ width: '100%', background: 'var(--avp-card)', color: cooldown > 0 ? 'var(--avp-text-dim)' : 'var(--avp-text)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px', fontWeight: 600, fontSize: 13, cursor: cooldown > 0 ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
                {cooldown > 0 ? `🔄 Gerar novo link (${cooldown}s)` : '🔄 Gerar novo link'}
              </button>

              <button onClick={() => { setEnviado(false); setLink(null); setCooldown(0) }}
                style={{ width: '100%', background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Usar outro e-mail
              </button>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--avp-text-dim)' }}>
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>← Voltar ao login</a>
          </p>
        </div>
      </div>
    </div>
  )
}
