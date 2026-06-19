'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/app/components/PhoneInput'

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function formatarCPF(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export default function ConviteGestorForm({ siteNome, logoUrl }: { siteNome: string; logoUrl: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', cpf: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const cpfLimpo = form.cpf.replace(/\D/g, '')
  const cpfValido = validarCPF(form.cpf)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      setErro('CPF é obrigatório.')
      return
    }
    if (!cpfValido) {
      setErro('CPF inválido. Verifique os números.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/convite/gestor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, ''), cpf: form.cpf }),
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
    <div className="page-wrap">
      <div className="page-box">

        <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteNome} className="logo-site" style={{ height: 64, objectFit: 'contain', display: 'block', margin: '0 auto' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--avp-text)', margin: 0, letterSpacing: '-0.01em' }}>
              {siteNome}
            </h1>
          )}
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, margin: 0 }}>Cadastro UNIAVP PRO</p>
          <div className="alert alert-warning" style={{ marginTop: 12 }}>
            Após o cadastro, aguarde a ativação pela empresa.
          </div>
        </div>

        {sucesso ? (
          <div className="card-green" style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--avp-green)', marginBottom: 8 }}>Cadastro enviado!</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 24 }}>
              Sua solicitação foi recebida. Assim que a empresa ativar sua conta, você poderá fazer login.
            </p>
            <button onClick={() => router.push('/login')} className="btn btn-green">
              Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Nome completo *</label>
              <input className="input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Seu nome" />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="seu@email.com" />
            </div>
            <div>
              <label className="label">WhatsApp *</label>
              <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required />
            </div>
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                CPF *
                {cpfLimpo.length === 11 && (
                  <span style={{ fontSize: 12, color: cpfValido ? '#22c55e' : '#f87171', fontWeight: 700 }}>
                    {cpfValido ? 'válido' : 'inválido'}
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="input"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))}
                required
                style={{ borderColor: cpfLimpo.length === 11 && !cpfValido ? 'rgba(248,113,113,0.6)' : undefined }}
              />
              {cpfLimpo.length === 11 && !cpfValido && (
                <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>CPF inválido — verifique os números</p>
              )}
            </div>
            <div>
              <label className="label">Senha *</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} className="input" style={{ paddingRight: 44 }} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required placeholder="Mínimo 6 caracteres" minLength={6} />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  {verSenha
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {erro && <div className="alert alert-error">{erro}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ fontSize: 15, marginTop: 4 }}>
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
