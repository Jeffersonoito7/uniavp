'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/app/components/PhoneInput'

export default function ConviteGestorForm({ siteNome, logoUrl }: { siteNome: string; logoUrl: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    const res = await fetch('/api/convite/gestor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, '') }),
    })
    const data = await res.json()
    if (data.ok) {
      setSucesso(true)
    } else {
      setErro(data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', fontFamily: 'Inter, sans-serif', color: 'var(--avp-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo e título */}
        <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteNome} className="logo-site" style={{ height: 64, objectFit: 'contain', display: 'block', margin: '0 auto' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <h1 style={{ fontSize: 26, fontWeight: 900, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              {siteNome}
            </h1>
          )}
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, margin: 0 }}>Cadastro de Gestor</p>
          <div style={{ marginTop: 12, background: '#f59e0b20', border: '1px solid #f59e0b50', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#f59e0b' }}>
            Após o cadastro, aguarde a ativação pela empresa.
          </div>
        </div>

        {sucesso ? (
          <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--avp-green)', marginBottom: 8 }}>Cadastro enviado!</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 24 }}>
              Sua solicitação foi recebida. Assim que a empresa ativar sua conta, você poderá fazer login.
            </p>
            <button onClick={() => router.push('/login')}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={lbl}>Nome completo *</label>
              <input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Seu nome" />
            </div>
            <div>
              <label style={lbl}>E-mail *</label>
              <input type="email" style={inp} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="seu@email.com" />
            </div>
            <div>
              <label style={lbl}>WhatsApp *</label>
              <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required />
            </div>
            <div>
              <label style={lbl}>Senha *</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  {verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {erro && (
              <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--avp-danger)' }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '14px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? 'Enviando...' : 'Solicitar cadastro como Gestor'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--avp-text-dim)' }}>
              Já tem conta?{' '}
              <a href="/login" style={{ color: 'var(--avp-blue)', textDecoration: 'none', fontWeight: 600 }}>Entrar</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
