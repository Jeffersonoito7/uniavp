'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function LogoOito7() {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <span style={{ fontWeight: 700, fontSize: 28, color: '#818cf8', marginBottom: 4 }}>
        Oito7 Digital
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/oito7-logo.png"
      alt="Oito7 Digital"
      onError={() => setErr(true)}
      style={{ width: 200, height: 'auto', maxHeight: 72, objectFit: 'contain', marginBottom: 4, filter: 'brightness(0) invert(1)' }}
    />
  )
}

export default function SuperLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error || !data.user) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }

    const { data: sa } = await supabase.from('super_admins').select('id').eq('user_id', data.user.id).eq('ativo', true).maybeSingle()
    if (sa) { window.location.href = '/super'; return }

    setErro('Acesso restrito à equipe Oito7 Digital.')
    await supabase.auth.signOut()
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    setErro('')
    const supabase = getSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/super/redefinir-senha`,
    })
    setResetLoading(false)
    if (error) { setErro('Erro ao enviar e-mail. Verifique o endereço.'); return }
    setMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.')
    setShowReset(false)
  }

  return (
    <div className="page-wrap">
      <div className="page-box">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <LogoOito7 />
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Painel Master — Gestão de Clientes</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {erro && <div className="alert alert-error" style={{ marginBottom: 16 }}>{erro}</div>}
          {msg  && <div className="alert alert-success" style={{ marginBottom: 16 }}>{msg}</div>}

          {!showReset ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ fontSize: 15 }}>
                {loading ? 'Entrando...' : 'Acessar Painel'}
              </button>
              <button type="button" onClick={() => { setShowReset(true); setErro(''); setMsg('') }}
                style={{ background: 'none', border: 'none', color: 'var(--avp-blue)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 4 }}>Digite seu e-mail para receber o link de redefinição:</p>
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={resetLoading} className="btn btn-primary btn-full" style={{ fontSize: 15 }}>
                {resetLoading ? 'Enviando...' : 'Enviar link'}
              </button>
              <button type="button" onClick={() => { setShowReset(false); setErro(''); setMsg('') }}
                style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
