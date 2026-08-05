'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const NAVY   = '#0f2556'
const TEAL   = '#06b6d4'
const GREEN  = '#10b981'
const GRAD   = 'linear-gradient(135deg, #06b6d4, #10b981)'
const GRAD_H = 'linear-gradient(135deg, #22d3ee, #34d399)'
const BG     = '#07070e'
const CARD   = '#0d0d1a'
const BORDER = '#1c1c30'
const TEXT   = '#f1f5f9'
const MUTED  = '#64748b'
const DIMMED = '#94a3b8'

const TEMAS = {
  pro: { accent: '#22c55e', badge: 'Painel PRO' },
  free: { accent: '#3b82f6', badge: 'Painel FREE' },
  adm: { accent: '#818cf8', badge: 'Painel Admin' },
  default: { accent: TEAL, badge: '' },
}

const FEATURES = [
  'Trilhas de aprendizado estruturadas',
  'Certificado digital ao concluir',
  'Aulas em vídeo com quizzes interativos',
  'Progresso salvo automaticamente',
  'Suporte direto via WhatsApp',
  'Acesso completo pelo celular 24h',
]

function EntrarForm() {
  const searchParams = useSearchParams()
  const p = (searchParams.get('p') ?? 'default') as keyof typeof TEMAS
  const tema = TEMAS[p] ?? TEMAS.default

  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFalhou, setLogoFalhou] = useState(false)
  const [siteNome, setSiteNome] = useState('')

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setLogoUrl(d.logoPaginaUrl || d.logoUrl || '')
      setSiteNome(d.nome || '')
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await sb.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })
    if (error) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }

    const res = await fetch('/api/auth/perfil')
    const perfil = await res.json()
    if (perfil.redirect) {
      window.location.href = perfil.redirect
    } else {
      await sb.auth.signOut()
      setErro('Nenhuma conta encontrada com este e-mail.')
      setLoading(false)
    }
  }

  const accentBtn = p === 'default' ? GRAD : tema.accent
  const accentBtnHover = p === 'default' ? GRAD_H : tema.accent

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        .ep-root{
          min-height:100vh;
          display:flex;
          font-family:Inter,system-ui,sans-serif;
          background:${BG};
        }
        /* ── Painel esquerdo ── */
        .ep-side{
          display:none;
          width:45%;
          min-width:360px;
          background:linear-gradient(135deg,#1a56db 0%,#15b97a 100%);
          background-image:url('/bg-login.jpg'),linear-gradient(135deg,#1a56db 0%,#15b97a 100%);
          background-size:cover;
          background-position:center;
          flex-direction:column;
          justify-content:flex-end;
          padding:52px 48px;
          position:relative;
          overflow:hidden;
          flex-shrink:0;
          font-family:'Inter',system-ui,sans-serif;
        }
        .ep-side-overlay{
          position:absolute;inset:0;
          background:linear-gradient(to top,rgba(10,20,50,.82) 0%,rgba(10,20,50,.25) 55%,transparent 100%);
        }
        .ep-side-inner{position:relative;z-index:1;}
        .ep-eyebrow{
          font-size:10px;font-weight:600;
          letter-spacing:3px;text-transform:uppercase;
          color:rgba(255,255,255,.65);margin-bottom:10px;
          font-family:'Inter',system-ui,sans-serif;
        }
        .ep-headline{
          font-size:28px;font-weight:800;
          color:#fff;line-height:1.25;
          margin-bottom:16px;letter-spacing:-.5px;
          font-family:'Inter',system-ui,sans-serif;
        }
        .ep-rule{width:36px;height:2px;background:rgba(255,255,255,.4);margin-bottom:20px;}
        .ep-feature{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .ep-dot{
          width:18px;height:18px;border-radius:50%;
          background:rgba(255,255,255,.15);
          border:1px solid rgba(255,255,255,.3);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .ep-feature-text{font-size:13px;color:rgba(255,255,255,.85);line-height:1.3;font-family:'Inter',system-ui,sans-serif;}
        .ep-footer{
          margin-top:28px;
          font-size:10px;letter-spacing:2px;text-transform:uppercase;
          color:rgba(255,255,255,.3);font-family:'Inter',system-ui,sans-serif;
        }
        /* ── Painel direito ── */
        .ep-main{
          flex:1;display:flex;flex-direction:column;
          justify-content:center;align-items:center;
          padding:48px 24px;min-height:100vh;
        }
        .ep-wrap{width:100%;max-width:420px;}
        .ep-logo{text-align:center;margin-bottom:28px;}
        .ep-card{
          background:${CARD};border:1px solid ${BORDER};
          border-radius:14px;padding:32px 28px;
        }
        .ep-badge{
          display:inline-flex;align-items:center;gap:6px;
          border-radius:6px;padding:4px 12px;
          font-size:11px;font-weight:700;
          margin-bottom:18px;
        }
        .ep-title{font-size:20px;font-weight:700;color:${TEXT};margin-bottom:6px;letter-spacing:-.3px;}
        .ep-sub{font-size:13px;color:${MUTED};margin-bottom:26px;}
        label.ep-label{
          display:block;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:.05em;
          color:${DIMMED};margin-bottom:6px;
        }
        input.ep-inp{
          width:100%;background:#080812;
          border:1px solid ${BORDER};border-radius:9px;
          padding:11px 14px;color:${TEXT};font-size:14px;
          outline:none;transition:border-color .18s;font-family:inherit;
        }
        input.ep-inp:focus{border-color:${TEAL};}
        input.ep-inp::placeholder{color:#2e2e4a;}
        .ep-field{margin-bottom:18px;}
        .ep-pwd{position:relative;}
        .ep-eye{
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;color:${MUTED};
          display:flex;align-items:center;padding:0;
        }
        .ep-eye:hover{color:${DIMMED};}
        .ep-forgot{
          display:block;text-align:right;
          margin-top:6px;font-size:12px;
          color:${GREEN};text-decoration:none;
        }
        .ep-forgot:hover{text-decoration:underline;}
        .ep-btn{
          width:100%;padding:12px;
          border:none;border-radius:9px;
          font-size:14px;font-weight:700;
          cursor:pointer;margin-top:8px;
          transition:background .18s,opacity .18s;
        }
        .ep-btn:disabled{opacity:.55;cursor:default;}
        .ep-alert{
          border-radius:9px;padding:10px 14px;
          font-size:13px;display:flex;gap:8px;align-items:center;
          margin-bottom:18px;
          background:#1a0505;border:1px solid #3f1010;color:#f87171;
        }
        .ep-links{
          display:flex;justify-content:center;gap:20px;
          margin-top:18px;
        }
        .ep-links a{font-size:12px;font-weight:500;opacity:.5;text-decoration:none;}
        .ep-links a:hover{opacity:1;}
        .ep-bottom{
          text-align:center;margin-top:10px;
          font-size:11px;color:rgba(255,255,255,.12);
        }
        /* Mobile banner */
        .ep-mobile-banner{
          display:none;
          background:${NAVY};padding:18px 24px;
          text-align:center;border-bottom:2px solid ${TEAL};
        }
        .ep-mb-title{font-size:16px;font-weight:800;color:#fff;letter-spacing:-.2px;}
        .ep-mb-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:3px;}
        /* Breakpoints */
        @media(min-width:900px){
          .ep-side{display:flex;}
        }
        @media(max-width:899px){
          .ep-root{flex-direction:column;}
          .ep-mobile-banner{display:block;}
          .ep-main{padding:32px 20px 48px;}
          .ep-card{padding:24px 20px;}
          .ep-logo{display:none!important;}
        }
        @media(max-width:480px){
          .ep-main{padding:24px 16px 40px;}
          .ep-card{padding:20px 16px;}
          .ep-title{font-size:18px;}
        }
      `}</style>

      <div className="ep-root">

        {/* Painel esquerdo */}
        <div className="ep-side">
          <div className="ep-side-overlay" />
          <div className="ep-side-inner">
            <img src="/logo.png" alt="Universidade APV"
              style={{ height: 52, objectFit: 'contain', display: 'block', marginBottom: 32 }} />
            <p className="ep-eyebrow">Plataforma de Capacitacao</p>
            <h2 className="ep-headline">Aprenda.<br />Cresça.<br />Conquiste.</h2>
            <div className="ep-rule" />
            {[
              'Trilhas completas com certificado',
              'Aulas em video + quizzes',
              'Progresso e ranking em tempo real',
            ].map(f => (
              <div key={f} className="ep-feature">
                <div className="ep-dot">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ep-feature-text">{f}</span>
              </div>
            ))}
            <div className="ep-footer">uniavp.autovaleprevencoes.org.br</div>
          </div>
        </div>

        {/* Banner mobile */}
        <div className="ep-mobile-banner">
          <img src="/logo.png" alt="Universidade AVP"
            style={{ height: 56, objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
          <div className="ep-mb-sub">Plataforma de capacitacao</div>
        </div>

        {/* Painel direito */}
        <div className="ep-main">
          <div className="ep-wrap">

            {/* Logo completa — desktop */}
            <div className="ep-logo">
              <img src="/logo.png" alt="Universidade AVP"
                style={{ height: 88, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </div>

            <div className="ep-card">

              {tema.badge && (
                <div>
                  <span className="ep-badge" style={{
                    background: `${tema.accent}18`,
                    border: `1px solid ${tema.accent}35`,
                    color: tema.accent,
                  }}>
                    {tema.badge}
                  </span>
                </div>
              )}

              <div className="ep-title">Entrar na plataforma</div>
              <div className="ep-sub">Use seu e-mail e senha cadastrados</div>

              {erro && (
                <div className="ep-alert">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="ep-field">
                  <label className="ep-label">E-mail</label>
                  <input
                    className="ep-inp"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div className="ep-field">
                  <label className="ep-label">Senha</label>
                  <div className="ep-pwd">
                    <input
                      className="ep-inp"
                      type={verSenha ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="ep-eye" onClick={() => setVerSenha(v => !v)}>
                      {verSenha ? (
                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                        </svg>
                      ) : (
                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <a href="/recuperar-senha" className="ep-forgot">Esqueci minha senha</a>
                </div>

                <button
                  type="submit"
                  className="ep-btn"
                  disabled={loading}
                  style={{
                    background: loading ? 'rgba(100,100,100,.4)' : accentBtn,
                    color: '#fff',
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = accentBtnHover }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = accentBtn }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>

            {/* Links de painel — so quando sem badge */}
            {!tema.badge && (
              <div className="ep-links">
                {[
                  { label: 'FREE', color: '#60a5fa', href: '?p=free' },
                  { label: 'PRO', color: '#4ade80', href: '?p=pro' },
                  { label: 'Admin', color: '#818cf8', href: '?p=adm' },
                ].map(b => (
                  <a key={b.label} href={b.href} style={{ color: b.color }}>
                    {b.label}
                  </a>
                ))}
              </div>
            )}
            <p className="ep-bottom">Um unico acesso para todos os paineis</p>

          </div>
        </div>

      </div>
    </>
  )
}

export default function EntrarPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>Carregando...</div>
      </div>
    }>
      <EntrarForm />
    </Suspense>
  )
}
