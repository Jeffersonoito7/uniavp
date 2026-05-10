'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SiteLogoHeader from '@/app/components/SiteLogoHeader'
import PhoneInput from '@/app/components/PhoneInput'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    senha: '',
    gestor_nome: '',
    gestor_whatsapp: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [verSenha, setVerSenha] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setLoading(true)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        email: form.email,
        senha: form.senha,
        gestor_nome: form.gestor_nome,
        gestor_whatsapp: form.gestor_whatsapp.replace(/\D/g, ''),
      }),
    })
    const data = await res.json()
    if (data.aluno) {
      setSucesso('Conta criada com sucesso!')
      setTimeout(() => router.push('/login'), 1500)
    } else {
      setErro(data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--avp-black)',
    border: '1px solid var(--avp-border)',
    borderRadius: 8,
    padding: '12px 14px',
    color: 'var(--avp-text)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--avp-text-dim)',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: 500,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '32px 16px' }}>
      <div style={{ width: 440, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <SiteLogoHeader height={72} />
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Crie sua conta para iniciar a formação</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32 }}>
          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}
          {sucesso && (
            <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>
              {sucesso}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.nome}
                onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp *</label>
              <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required />
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Senha *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                  required minLength={6}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, marginTop: 4 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 14 }}>Dados do seu gestor</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nome do seu gestor *</label>
                  <input
                    type="text"
                    placeholder="Nome do gestor"
                    value={form.gestor_nome}
                    onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp do gestor *</label>
                  <PhoneInput value={form.gestor_whatsapp} onChange={v => setForm(p => ({ ...p, gestor_whatsapp: v }))} required placeholder="WhatsApp do seu gestor" />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 20 }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>Entrar</a>
          </p>
        </div>
      </div>
    </div>
  )
}
