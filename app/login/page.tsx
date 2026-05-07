'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginAVPPage() {
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
    if (error || !data.user) {
      setErro('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }
    const { data: adminData } = await supabase.from('admins').select('role').eq('user_id', data.user.id).eq('ativo', true).maybeSingle()
    if (adminData) { window.location.href = '/admin'; return }

    const { data: gestorData } = await supabase.from('gestores').select('id').eq('user_id', data.user.id).eq('ativo', true).maybeSingle()
    if (gestorData) { window.location.href = '/gestor'; return }

    const { data: alunoData } = await supabase.from('alunos').select('whatsapp').eq('user_id', data.user.id).maybeSingle()
    if (alunoData?.whatsapp) { window.location.href = `/aluno/${alunoData.whatsapp}`; return }

    setErro('Usuário sem perfil cadastrado.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 400, maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo AVP" style={{ height: 72, objectFit: 'contain', marginBottom: 14, display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            UNIVERSIDADE AVP
          </h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>Acesse sua conta para continuar</p>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            <a href="/captacao" style={{ color: 'var(--avp-green)' }}>Sou consultor</a>
            {' · '}
            <a href="/planos" style={{ color: 'var(--avp-text-dim)' }}>Para empresas</a>
          </p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <a href="/recuperar-senha" style={{ color: 'var(--avp-text-dim)', fontSize: 12, textDecoration: 'none' }}>Esqueci minha senha</a>
            </div>
            <button
              type="submit"
              disabled={loading}
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
