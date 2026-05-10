'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ConsultorLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)

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
    const res = await fetch('/api/auth/perfil')
    const perfil = await res.json()
    if (perfil.redirect) {
      window.location.href = perfil.redirect
    } else {
      await supabase.auth.signOut()
      setErro('Usuário sem cadastro de consultor. Verifique com seu gestor.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1a 0%, #03183a 50%, #010d1f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Marca d'água consultor de sucesso */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.04, fontSize: 320 }}>🏆</div>
      <div style={{ position: 'absolute', bottom: 40, right: 60, pointerEvents: 'none', opacity: 0.05, fontSize: 180 }}>📈</div>
      <div style={{ position: 'absolute', top: 40, left: 60, pointerEvents: 'none', opacity: 0.04, fontSize: 150 }}>🎯</div>

      <div style={{ width: 400, maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: 8, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', display: 'inline-block' }}>
            Área do Consultor
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 32, backdropFilter: 'blur(8px)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, textAlign: 'center', color: '#fff' }}>Acesse sua área</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Entre com suas credenciais de consultor</p>

          {erro && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>E-mail</label>
              <input type="email" placeholder="seu@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '12px 44px 12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setVerSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="/recuperar-senha" style={{ color: 'rgba(59,130,246,0.8)', fontSize: 12, textDecoration: 'none' }}>Esqueci minha senha</a>
            </div>
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Ainda não tem cadastro?{' '}
            <a href="/captacao" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se aqui</a>
          </p>
        </div>
      </div>
    </div>
  )
}
