'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function GestorLoginForm({ logoUrl, siteNome }: { logoUrl: string; siteNome: string }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [logoFalhou, setLogoFalhou] = useState(false)

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

    // Verificar se é gestor — API exclusiva para gestor
    const res = await fetch('/api/auth/perfil-gestor')
    const perfil = await res.json()

    if (perfil.redirect) {
      window.location.href = '/gestor/otp'
      return
    }

    // Não é gestor — fazer logout e mostrar erro
    await supabase.auth.signOut()

    if (perfil.tipo === 'gestor_inativo') {
      setErro('Sua conta ainda não foi ativada. Aguarde a aprovação.')
    } else {
      setErro('Este e-mail não está cadastrado como gestor.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #021a0e 0%, #032b17 50%, #01120a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Marca d'água gestor */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', userSelect: 'none', opacity: 0.04,
        fontSize: 320, lineHeight: 1,
      }}>👔</div>
      <div style={{
        position: 'absolute', bottom: 40, right: 60, pointerEvents: 'none',
        opacity: 0.06, fontSize: 180,
      }}>📊</div>
      <div style={{
        position: 'absolute', top: 40, left: 60, pointerEvents: 'none',
        opacity: 0.05, fontSize: 150,
      }}>🤝</div>
      <div style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoUrl && !logoFalhou ? (
            <img src={logoUrl} alt={siteNome} className="logo-site"
              style={{ height: 72, objectFit: 'contain', marginBottom: 14 }}
              onError={() => setLogoFalhou(true)} />
          ) : (
            siteNome && <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>{siteNome}</h1>
          )}
          <div style={{ background: 'var(--grad-brand)', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>
            Painel Gestor
          </div>
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>Acesso do Gestor</h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Entre com suas credenciais de gestor</p>

          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>E-mail</label>
              <input type="email" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 44px 12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setVerSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="/recuperar-senha" style={{ color: 'var(--avp-text-dim)', fontSize: 12, textDecoration: 'none' }}>Esqueci minha senha</a>
            </div>
            <button type="submit" disabled={loading}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
