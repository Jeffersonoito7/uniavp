'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginForm({ logoUrl, siteNome, isDominioMaster, whatsappSuporte }: { logoUrl: string; siteNome: string; isDominioMaster: boolean; whatsappSuporte?: string }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [logoFalhou, setLogoFalhou] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [fromCtx, setFromCtx] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('msg') === 'senha-redefinida') {
      setSucesso('Senha redefinida com sucesso. Faça login com a nova senha.')
      window.history.replaceState({}, '', '/login')
    }
    if (params.get('from')) setFromCtx(params.get('from')!)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const qs = fromCtx ? `?from=${fromCtx}` : ''
    const res = await fetch(`/api/auth/perfil${qs}`)
    const perfil = await res.json()

    if (perfil.redirect) {
      window.location.href = perfil.redirect
      return
    }

    if (perfil.tipo === 'gestor_inativo') {
      await supabase.auth.signOut()
      setErro('Sua conta ainda não foi ativada. Aguarde a aprovação da empresa.')
      setLoading(false)
      return
    }

    if (perfil.tipo === 'acesso_negado') {
      await supabase.auth.signOut()
      setErro('Acesso negado. Este painel é exclusivo para administradores.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setErro('Usuário sem perfil cadastrado. Entre em contato com a empresa.')
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#080810', border: '1px solid #1e1f2e', borderRadius: 8,
    padding: '11px 14px', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: 400, maxWidth: '95vw' }}>

        {/* Logo / Nome */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {logoUrl && !logoFalhou ? (
            <img src={logoUrl} alt={siteNome} style={{ height: 56, objectFit: 'contain', marginBottom: 16, display: 'block', margin: '0 auto 16px' }}
              onError={() => setLogoFalhou(true)} />
          ) : siteNome ? (
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em', marginBottom: 16 }}>
              {siteNome}
            </h1>
          ) : null}
          <p style={{ color: '#64748b', fontSize: 14 }}>Acesse sua conta para continuar</p>
          {isDominioMaster && (
            <p style={{ marginTop: 10, fontSize: 13 }}>
              <a href="/captacao" style={{ color: '#818cf8', textDecoration: 'none' }}>Sou consultor</a>
              <span style={{ color: '#1e1f2e', margin: '0 8px' }}>·</span>
              <a href="/planos" style={{ color: '#64748b', textDecoration: 'none' }}>Para empresas</a>
            </p>
          )}
        </div>

        {/* Card */}
        <div style={{ background: '#0f0f17', border: '1px solid #1e1f2e', borderRadius: 12, padding: '28px 24px' }}>

          {sucesso && (
            <div style={{ background: '#0a1f12', border: '1px solid #166534', borderRadius: 8, padding: '10px 14px', color: '#4ade80', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {sucesso}
            </div>
          )}

          {erro && (
            <div style={{ background: '#1a0a0a', border: '1px solid #3f1515', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                E-mail
              </label>
              <input
                type="email" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={inp}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ ...inp, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {verSenha ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <a href="/recuperar-senha" style={{ color: '#475569', fontSize: 12, textDecoration: 'none' }}>
                Esqueci minha senha
              </a>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#334155' }}>
          Problemas para acessar?{' '}
          {whatsappSuporte ? (
            <a href={`https://wa.me/${whatsappSuporte.replace(/\D/g, '')}`} style={{ color: '#475569', textDecoration: 'none' }}>Fale com o suporte</a>
          ) : (
            <span style={{ color: '#475569' }}>Fale com o suporte</span>
          )}
        </p>
      </div>
    </div>
  )
}
