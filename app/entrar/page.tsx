'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function EntrarPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const [siteNome, setSiteNome] = useState('')

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setLogoUrl(d.logoPaginaUrl || d.logoUrl || '')
      setSiteNome(d.nome || 'UNIAVP')
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/perfil')
    const perfil = await res.json()

    if (perfil.redirect) {
      window.location.href = '/entrar/otp'
    } else {
      await supabase.auth.signOut()
      setErro('Nenhuma conta encontrada com este e-mail.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Elementos decorativos de fundo */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(51,54,135,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(2,161,83,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo + Nome */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteNome}
              style={{ height: 72, objectFit: 'contain', marginBottom: 16, filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }} />
          ) : (
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          )}
          {!logoUrl && (
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 1 }}>
              {siteNome}
            </h1>
          )}
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 8 }}>
            Acesse sua conta para continuar
          </p>
        </div>

        {/* Card de login */}
        <div style={{
          background: 'rgba(15,23,42,0.80)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          padding: '36px 32px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>
          {erro && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                style={inp}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ ...inp, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 0 }}
                >
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="/recuperar-senha" style={{ color: 'rgba(99,102,241,0.8)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 12, padding: '15px',
                fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, boxShadow: loading ? 'none' : '0 8px 32px rgba(99,102,241,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ Entrando...' : 'Entrar →'}
            </button>
          </form>

          {/* Separador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>não tem conta?</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <a href="/captacao"
            style={{ display: 'block', textAlign: 'center', background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', color: '#22c55e', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            🆓 Criar conta UNIAVP FREE
          </a>
        </div>

        {/* Badges de tipo de conta */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { icon: '🆓', label: 'FREE', color: '#22c55e' },
            { icon: '✨', label: 'PRO', color: '#818cf8' },
            { icon: '🛡', label: 'Admin', color: '#f59e0b' },
          ].map(b => (
            <span key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              <span>{b.icon}</span>
              <span style={{ color: b.color, opacity: 0.7 }}>{b.label}</span>
            </span>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
          Um único acesso para todos os painéis
        </p>
      </div>
    </div>
  )
}
