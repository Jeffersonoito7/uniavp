'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SuperLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error || !data.user) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }

    const { data: sa } = await supabase.from('super_admins').select('id').eq('user_id', data.user.id).eq('ativo', true).maybeSingle()
    if (sa) { window.location.href = '/super'; return }

    setErro('Acesso restrito à equipe Oito7 Digital.')
    await supabase.auth.signOut()
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 400, maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 4 }}>OITO7 DIGITAL</h1>
          <p style={{ color: '#8a8fa3', fontSize: 14 }}>Painel Master — Gestão de Clientes</p>
        </div>
        <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 16, padding: 32 }}>
          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#8a8fa3', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
                style={{ width: '100%', background: '#08090d', border: '1px solid #252836', borderRadius: 8, padding: '12px 14px', color: '#f0f1f5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8a8fa3', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Senha</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                style={{ width: '100%', background: '#08090d', border: '1px solid #252836', borderRadius: 8, padding: '12px 14px', color: '#f0f1f5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
