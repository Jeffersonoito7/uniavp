'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ThemeToggle from '@/app/components/ThemeToggle'

export default function LoginForm({ logoUrl, siteNome, isDominioMaster }: { logoUrl: string; siteNome: string; isDominioMaster: boolean }) {
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
      setSucesso('Senha redefinida com sucesso! Faça login com a nova senha.')
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

    // Usar API server-side para checar perfil (bypassa RLS do Supabase)
    const qs = fromCtx ? `?from=${fromCtx}` : ''
    const res = await fetch(`/api/auth/perfil${qs}`)
    const perfil = await res.json()

    if (perfil.redirect) {
      window.location.href = perfil.redirect
      return
    }

    if (perfil.tipo === 'gestor_inativo') {
      await supabase.auth.signOut()
      setErro('Sua conta de gestor ainda não foi ativada. Aguarde a aprovação da empresa.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setErro('Usuário sem perfil cadastrado. Entre em contato com a empresa.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeToggle /></div>
      <div style={{ width: 400, maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && !logoFalhou ? (
            <img src={logoUrl} alt={siteNome} className="logo-site" style={{ height: 72, objectFit: 'contain', marginBottom: 14, display: 'block' }}
              onError={() => setLogoFalhou(true)} />
          ) : (
            siteNome && (
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                {siteNome}
              </h1>
            )
          )}
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>Acesse sua conta para continuar</p>
          {isDominioMaster && (
            <p style={{ marginTop: 8, fontSize: 13 }}>
              <a href="/captacao" style={{ color: 'var(--avp-green)' }}>Sou consultor</a>
              {' · '}
              <a href="/planos" style={{ color: 'var(--avp-text-dim)' }}>Para empresas</a>
            </p>
          )}
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {sucesso && (
            <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>
              ✅ {sucesso}
            </div>
          )}
          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>E-mail</label>
              <input
                type="email" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 44px 12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="/recuperar-senha" style={{ color: 'var(--avp-text-dim)', fontSize: 12, textDecoration: 'none' }}>Esqueci minha senha</a>
            </div>
            <button
              type="submit" disabled={loading}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
