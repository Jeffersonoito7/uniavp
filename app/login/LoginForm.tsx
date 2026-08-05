'use client'
import { useState, useEffect } from 'react'
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

const FEATURES = [
  'Trilhas de aprendizado estruturadas',
  'Certificado digital ao concluir',
  'Aulas em vídeo com quizzes interativos',
  'Progresso salvo automaticamente',
  'Suporte direto via WhatsApp',
  'Acesso completo pelo celular 24h',
]

export default function LoginForm({
  logoUrl, siteNome, isDominioMaster, whatsappSuporte,
}: {
  logoUrl: string
  siteNome: string
  isDominioMaster: boolean
  whatsappSuporte?: string
}) {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [sucesso, setSucesso]     = useState('')
  const [logoFalhou, setLogoFalhou] = useState(false)
  const [verSenha, setVerSenha]   = useState(false)
  const [fromCtx, setFromCtx]     = useState('')
  const [recuperando, setRecuperando] = useState(false)
  const [emailRecupera, setEmailRecupera] = useState('')
  const [enviado, setEnviado]     = useState(false)
  const [loadingRec, setLoadingRec] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('msg') === 'senha-redefinida')
      setSucesso('Senha redefinida com sucesso. Faça login.')
    if (params.get('from')) setFromCtx(params.get('from')!)
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
      email: form.email,
      password: form.password,
    })
    if (error) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }

    const qs = fromCtx ? `?from=${fromCtx}` : ''
    const res = await fetch(`/api/auth/perfil${qs}`)
    const perfil = await res.json()

    if (perfil.redirect) { window.location.href = perfil.redirect; return }
    if (perfil.tipo === 'gestor_inativo') {
      await sb.auth.signOut()
      setErro('Sua conta ainda não foi ativada. Aguarde a aprovação.')
      setLoading(false); return
    }
    if (perfil.tipo === 'acesso_negado') {
      await sb.auth.signOut()
      setErro('Acesso negado. Painel exclusivo para administradores.')
      setLoading(false); return
    }
    await sb.auth.signOut()
    setErro('Usuário sem perfil. Entre em contato com a empresa.')
    setLoading(false)
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoadingRec(true)
    const res = await fetch('/api/auth/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailRecupera }),
    })
    setLoadingRec(false)
    if (!res.ok) {
      const d = await res.json()
      setErro(d.erro || 'Erro ao enviar. Tente novamente.')
      return
    }
    setEnviado(true)
  }

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        .lp-root{
          min-height:100vh;
          display:flex;
          font-family:Inter,system-ui,sans-serif;
          background:${BG};
        }
        /* ── Painel esquerdo ── */
        .lp-side{
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
        .lp-side-overlay{
          position:absolute;inset:0;
          background:linear-gradient(to top,rgba(10,20,50,.82) 0%,rgba(10,20,50,.25) 55%,transparent 100%);
        }
        .lp-side-inner{position:relative;z-index:1;}
        .lp-eyebrow{
          font-size:10px;font-weight:600;
          letter-spacing:3px;text-transform:uppercase;
          color:rgba(255,255,255,.65);margin-bottom:10px;
          font-family:'Inter',system-ui,sans-serif;
        }
        .lp-headline{
          font-size:28px;font-weight:800;
          color:#fff;line-height:1.25;
          margin-bottom:16px;letter-spacing:-.5px;
          font-family:'Inter',system-ui,sans-serif;
        }
        .lp-rule{
          width:36px;height:2px;
          background:rgba(255,255,255,.4);
          margin-bottom:20px;
        }
        .lp-feature{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom:14px;
        }
        .lp-dot{
          width:18px; height:18px;
          border-radius:50%;
          background:rgba(255,255,255,.15);
          border:1px solid rgba(255,255,255,.3);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .lp-feature-text{
          font-size:13.5px;
          color:rgba(255,255,255,.78);
          line-height:1.4;
        }
        .lp-footer{
          position:absolute;
          bottom:28px; left:52px;
          font-size:10px;
          letter-spacing:3px;
          text-transform:uppercase;
          color:rgba(255,255,255,.18);
        }
        /* ── Painel direita ── */
        .lp-main{
          flex:1;
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          padding:48px 24px;
          min-height:100vh;
        }
        .lp-form-wrap{
          width:100%;
          max-width:420px;
        }
        .lp-logo-area{
          text-align:center;
          margin-bottom:32px;
        }
        .lp-card{
          background:${CARD};
          border:1px solid ${BORDER};
          border-radius:14px;
          padding:32px 28px;
        }
        .lp-card-title{
          font-size:20px;
          font-weight:700;
          color:${TEXT};
          margin-bottom:6px;
          letter-spacing:-.3px;
        }
        .lp-card-sub{
          font-size:13px;
          color:${MUTED};
          margin-bottom:26px;
        }
        label.lp-label{
          display:block;
          font-size:11px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:.05em;
          color:${DIMMED};
          margin-bottom:6px;
        }
        input.lp-inp{
          width:100%;
          background:#080812;
          border:1px solid ${BORDER};
          border-radius:9px;
          padding:11px 14px;
          color:${TEXT};
          font-size:14px;
          outline:none;
          transition:border-color .18s;
        }
        input.lp-inp:focus{border-color:${TEAL};}
        input.lp-inp::placeholder{color:#2e2e4a;}
        .lp-field{margin-bottom:18px;}
        .lp-pwd-wrap{position:relative;}
        .lp-pwd-btn{
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:${MUTED};
          display:flex; align-items:center; padding:0;
        }
        .lp-pwd-btn:hover{color:${DIMMED};}
        .lp-forgot{
          display:block; text-align:right;
          margin-top:6px; font-size:12px;
          color:${GREEN}; text-decoration:none; background:none; border:none;
          cursor:pointer;
        }
        .lp-forgot:hover{text-decoration:underline;}
        .lp-btn{
          width:100%; padding:12px;
          background:${GRAD}; color:#fff;
          font-size:14px; font-weight:700;
          border:none; border-radius:9px; cursor:pointer;
          transition:background .18s, opacity .18s;
          margin-top:8px;
        }
        .lp-btn:hover{background:${GRAD_H};}
        .lp-btn:disabled{opacity:.55; cursor:default;}
        .lp-alert-err{
          background:#1a0505; border:1px solid #3f1010;
          border-radius:9px; padding:10px 14px;
          color:#f87171; font-size:13px;
          display:flex; gap:8px; align-items:center;
          margin-bottom:18px;
        }
        .lp-alert-ok{
          background:#0a1a0a; border:1px solid #14532d;
          border-radius:9px; padding:10px 14px;
          color:#4ade80; font-size:13px;
          display:flex; gap:8px; align-items:center;
          margin-bottom:18px;
        }
        .lp-back{
          display:flex; align-items:center; gap:6px;
          font-size:13px; color:${MUTED}; background:none; border:none;
          cursor:pointer; margin-bottom:24px;
          transition:color .15s;
        }
        .lp-back:hover{color:${TEXT};}
        .lp-bottom{
          text-align:center; margin-top:20px;
          font-size:12px; color:#2e2e4a;
        }
        .lp-bottom a{color:${MUTED}; text-decoration:none;}
        .lp-bottom a:hover{color:${TEXT};}
        .lp-links{
          text-align:center; margin-top:12px;
          font-size:13px; display:flex; gap:16px;
          justify-content:center;
        }
        .lp-links a{color:${MUTED}; text-decoration:none;}
        .lp-links a:hover{color:${TEAL};}
        /* Mobile: banner topo */
        .lp-mobile-banner{
          display:none;
          background:${NAVY};
          padding:18px 24px;
          text-align:center;
          border-bottom:2px solid ${TEAL};
        }
        .lp-mobile-title{
          font-size:16px; font-weight:800; color:#fff; letter-spacing:-.2px;
        }
        .lp-mobile-sub{
          font-size:11px; color:rgba(255,255,255,.5); margin-top:3px;
        }
        /* ── Breakpoints ── */
        @media(min-width:900px){
          .lp-side{display:flex;}
        }
        @media(max-width:899px){
          .lp-root{flex-direction:column;}
          .lp-mobile-banner{display:block;}
          .lp-main{padding:32px 20px 48px;}
          .lp-card{padding:24px 20px;}
        }
        @media(max-width:480px){
          .lp-main{padding:24px 16px 40px;}
          .lp-card{padding:20px 16px;}
          .lp-card-title{font-size:18px;}
        }
      `}</style>

      <div className="lp-root">

        {/* ── PAINEL ESQUERDO (desktop) ── */}
        <div className="lp-side">
          <div className="lp-side-overlay" />
          <div className="lp-side-inner">
            <img src="/logo.png" alt="Universidade AVP"
              style={{ height: 80, objectFit: 'contain', display: 'block', marginBottom: 32 }} />
            <p className="lp-eyebrow">Plataforma de Capacitacao</p>
            <h2 className="lp-headline">Aprenda.<br />Cresça.<br />Conquiste.</h2>
            <div className="lp-rule" />
            {[
              'Trilhas completas com certificado',
              'Aulas em video + quizzes',
              'Progresso e ranking em tempo real',
            ].map(f => (
              <div key={f} className="lp-feature">
                <div className="lp-dot">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="lp-feature-text">{f}</span>
              </div>
            ))}
            <div className="lp-footer" style={{ marginTop: 28 }}>uniavp.autovaleprevencoes.org.br</div>
          </div>
        </div>

        {/* ── BANNER MOBILE ── */}
        <div className="lp-mobile-banner">
          <img src="/logo.png" alt="Universidade AVP"
            style={{ height: 60, objectFit: 'contain', margin: '0 auto 4px', display: 'block' }} />
          <div className="lp-mobile-sub">Plataforma de capacitacao</div>
        </div>

        {/* ── PAINEL DIREITO (formulario) ── */}
        <div className="lp-main">
          <div className="lp-form-wrap">

            {/* Logo completa — so desktop */}
            <div className="lp-logo-area" style={{ display: 'none' }} id="lp-logo-desktop">
              <img src="/logo.png" alt="Universidade AVP"
                style={{ height: 88, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </div>
            <style>{`@media(min-width:900px){#lp-logo-desktop{display:block!important;}}`}</style>

            <div className="lp-card">

              {sucesso && (
                <div className="lp-alert-ok">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  {sucesso}
                </div>
              )}

              {!recuperando ? (
                <>
                  <div className="lp-card-title">Entrar na plataforma</div>
                  <div className="lp-card-sub">Use seu e-mail e senha cadastrados</div>

                  {erro && (
                    <div className="lp-alert-err">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {erro}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="lp-field">
                      <label className="lp-label">E-mail</label>
                      <input
                        className="lp-inp"
                        type="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="lp-field">
                      <label className="lp-label">Senha</label>
                      <div className="lp-pwd-wrap">
                        <input
                          className="lp-inp"
                          type={verSenha ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={form.password}
                          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                          required
                          style={{ paddingRight: 44 }}
                        />
                        <button type="button" className="lp-pwd-btn" onClick={() => setVerSenha(v => !v)}>
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
                      <button type="button" className="lp-forgot" onClick={() => { setRecuperando(true); setErro('') }}>
                        Esqueci minha senha
                      </button>
                    </div>

                    <button type="submit" className="lp-btn" disabled={loading}>
                      {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                  </form>

                  {isDominioMaster && (
                    <div className="lp-links" style={{ marginTop: 20 }}>
                      <a href="/captacao">Sou consultor</a>
                      <a href="/planos">Para empresas</a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="lp-back" onClick={() => { setRecuperando(false); setEnviado(false); setErro('') }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    Voltar ao login
                  </button>

                  <div className="lp-card-title">Recuperar senha</div>
                  <div className="lp-card-sub">Enviaremos um link para seu e-mail</div>

                  {enviado ? (
                    <div className="lp-alert-ok" style={{ marginTop: 8 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Link enviado. Verifique sua caixa de entrada e a pasta de spam.
                    </div>
                  ) : (
                    <form onSubmit={handleRecuperar}>
                      {erro && (
                        <div className="lp-alert-err">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {erro}
                        </div>
                      )}
                      <div className="lp-field">
                        <label className="lp-label">E-mail</label>
                        <input
                          className="lp-inp"
                          type="email"
                          placeholder="seu@email.com"
                          value={emailRecupera}
                          onChange={e => setEmailRecupera(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="lp-btn" disabled={loadingRec}>
                        {loadingRec ? 'Enviando...' : 'Enviar link de recuperação'}
                      </button>
                    </form>
                  )}
                </>
              )}

            </div>

            <div className="lp-bottom">
              Problemas para acessar?{' '}
              {whatsappSuporte ? (
                <a href={`https://wa.me/${whatsappSuporte.replace(/\D/g, '')}`}>Fale com o suporte</a>
              ) : (
                <span style={{ color: MUTED }}>Fale com o suporte</span>
              )}
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
