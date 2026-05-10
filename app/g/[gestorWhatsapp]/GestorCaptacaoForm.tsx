'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from '@/app/components/PhoneInput'

type Gestor = { nome: string; whatsapp: string }

export default function GestorCaptacaoForm({ gestor, siteNome, logoUrl }: { gestor: Gestor; siteNome: string; logoUrl: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        email: form.email,
        senha: form.senha,
        gestor_nome: gestor.nome,
        gestor_whatsapp: gestor.whatsapp,
      }),
    })
    const data = await res.json()
    if (data.ok || data.aluno) {
      setSucesso(true)
      setTimeout(() => router.push('/consultor/login'), 2500)
    } else {
      setErro(data.erro ?? data.error ?? 'Erro ao criar conta. Tente novamente.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020d1a 0%, #03183a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Cadastro realizado!</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #020d1a 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl && <img src={logoUrl} alt={siteNome} style={{ height: 36, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        </div>
        <a href="/consultor/login" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 18px', transition: 'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}>
          Já tenho conta →
        </a>
      </header>

      {/* BODY */}
      <div className="split-layout" style={{ flex: 1, display: 'flex', alignItems: 'stretch', maxWidth: 1100, width: '100%', margin: '0 auto', padding: '40px 24px', gap: 60 }}>

        {/* LADO ESQUERDO — Info */}
        <div className="split-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#4ade80', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 28, width: 'fit-content' }}>
            🎯 Convite de {gestor.nome}
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Sua formação como<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              consultor começa aqui
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 420 }}>
            {gestor.nome} está te convidando para a {siteNome}. Treinamento gratuito, certificado oficial e acompanhamento do seu gestor.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📱', texto: '100% online — estude pelo celular, no seu tempo' },
              { icon: '🎓', texto: 'Certificado oficial ao concluir o treinamento' },
              { icon: '🏆', texto: 'Ganhe pontos e medalhas ao longo da formação' },
              { icon: '👤', texto: `${gestor.nome} acompanha seu progresso em tempo real` },
            ].map(b => (
              <div key={b.texto} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{b.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{b.texto}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DIREITO — Formulário */}
        <div className="split-form" style={{ width: 420, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36, backdropFilter: 'blur(12px)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Criar conta grátis</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 }}>
              Cadastrado como consultor de <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{gestor.nome}</strong>
            </p>

            {erro && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nome completo *</label>
                <input type="text" placeholder="Seu nome" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>WhatsApp *</label>
                <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-mail *</label>
                <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha}
                    onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 48 }} />
                  <button type="button" onClick={() => setVerSenha(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', display: 'flex' }}>
                    {verSenha
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none',
                borderRadius: 12, padding: '15px', fontWeight: 800, fontSize: 16,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
                opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}>
                {loading ? 'Criando conta...' : '🚀 Criar minha conta grátis'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 20 }}>
              Já tem cadastro?{' '}
              <a href="/consultor/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Entrar aqui</a>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
