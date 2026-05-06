'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CaptacaoPage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
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

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      setSucesso('Conta criada! Faça login para começar.')
      setTimeout(() => router.push('/login?msg=cadastro'), 1800)
    } else {
      setErro(data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(8,9,13,0.8)',
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
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', fontFamily: 'Inter, sans-serif', color: 'var(--avp-text)' }}>
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px', background: 'linear-gradient(180deg, rgba(51,54,135,0.15) 0%, rgba(8,9,13,0) 100%)' }}>
        <div style={{ marginBottom: 24 }}>
          <img src="/logo.png" alt="Logo AVP" style={{ height: 64, marginBottom: 16 }} />
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>UNIVERSIDADE AVP</p>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, maxWidth: 700, marginBottom: 20 }}>
          <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Torne-se um Consultor AVP
          </span>{' '}
          de Sucesso
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 18, maxWidth: 560, lineHeight: 1.6, marginBottom: 36 }}>
          Formação 100% online, no seu ritmo. Módulos práticos, quiz de fixação e certificado reconhecido.
        </p>
        <button
          onClick={scrollToForm}
          style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '16px 40px', fontWeight: 700, fontSize: 17, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          Quero me cadastrar
        </button>
      </section>

      <section style={{ padding: '80px 24px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { icon: '📱', titulo: '100% Online', descricao: 'Estude pelo celular ou computador, onde e quando quiser' },
            { icon: '🎓', titulo: 'Certificado Oficial', descricao: 'Receba seu certificado ao concluir todos os módulos' },
            { icon: '🚀', titulo: 'Trilha Estruturada', descricao: 'Módulos organizados em sequência lógica com avaliações' },
          ].map(b => (
            <div
              key={b.titulo}
              style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, textAlign: 'center' }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{b.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{b.titulo}</h3>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6 }}>{b.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section ref={formRef} style={{ padding: '40px 24px 80px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 40, backdropFilter: 'blur(12px)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Comece agora</h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Preencha os dados abaixo e inicie sua formação</p>
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              <input
                type="tel"
                placeholder="11999999999"
                value={form.whatsapp}
                onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))}
                required
                style={inputStyle}
              />
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
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 14, marginTop: 4 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 12 }}>Dados do seu gestor</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  <input
                    type="tel"
                    placeholder="11999999999"
                    value={form.gestor_whatsapp}
                    onChange={e => setForm(p => ({ ...p, gestor_whatsapp: e.target.value.replace(/\D/g, '') }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Criando conta...' : 'Iniciar minha formação'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 20 }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>Entrar</a>
          </p>
        </div>
      </section>
    </div>
  )
}
