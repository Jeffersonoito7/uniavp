'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Gestor = { nome: string; whatsapp: string }

export default function GestorCaptacaoForm({ gestor, siteNome, logoUrl }: { gestor: Gestor; siteNome: string; logoUrl: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [verSenha, setVerSenha] = useState(false)

  function scrollToForm() { formRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setSucesso(''); setLoading(true)
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
      setSucesso('Conta criada! Redirecionando...')
      setTimeout(() => router.push('/consultor/login'), 1800)
    } else {
      setErro(data.erro ?? data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', fontFamily: 'Inter, sans-serif', color: 'var(--avp-text)' }}>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px', background: 'radial-gradient(ellipse at 50% 0%, rgba(51,54,135,0.4) 0%, transparent 60%), var(--avp-black)', position: 'relative' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 16 }}>
            <img src={logoUrl} className="logo-site" alt="Logo" style={{ height: 80, objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: 'var(--avp-green)', letterSpacing: 2, textTransform: 'uppercase' }}>
              🎯 Convite de {gestor.nome}
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {gestor.nome} te convidou!
            </span>
          </h1>
          <h2 style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 400, color: 'var(--avp-text-dim)', marginBottom: 24, lineHeight: 1.5 }}>
            Forme-se consultor e conquiste sua <strong style={{ color: 'var(--avp-text)' }}>independência financeira</strong>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--avp-text-dim)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Treinamento 100% online, gratuito, com módulos práticos, quizzes, certificado e acompanhamento do seu gestor.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToForm} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 40px', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 32px rgba(51,54,135,0.4)' }}>
              🚀 Aceitar convite e começar
            </button>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section style={{ padding: '80px 24px', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>O que você vai ter acesso</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { icon: '📱', titulo: '100% Online e Gratuito', desc: 'Estude pelo celular, a qualquer hora' },
            { icon: '🎓', titulo: 'Certificado Oficial', desc: 'Comprove sua qualificação com certificado reconhecido' },
            { icon: '🏆', titulo: 'Pontos e Medalhas', desc: 'Ganhe prêmios ao longo da sua formação' },
            { icon: '🔔', titulo: 'Suporte do Gestor', desc: `${gestor.nome} acompanha seu progresso em tempo real` },
          ].map(b => (
            <div key={b.titulo} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad-brand)' }} />
              <div style={{ fontSize: 32, marginBottom: 12 }}>{b.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{b.titulo}</h3>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section ref={formRef} style={{ padding: '20px 24px 100px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Criar minha conta <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>grátis</span></h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Você será cadastrado como consultor de <strong style={{ color: 'var(--avp-text)' }}>{gestor.nome}</strong></p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 36, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
          {erro && <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>{erro}</div>}
          {sucesso && <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>{sucesso}</div>}
          <div style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--avp-green)' }}>
            🎯 Gestor: <strong>{gestor.nome}</strong>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Seu nome completo *</label><input type="text" placeholder="Como você se chama?" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required style={inp} /></div>
            <div><label style={lbl}>Seu WhatsApp *</label><input type="tel" placeholder="5587999999999" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))} required style={inp} /></div>
            <div><label style={lbl}>Seu e-mail *</label><input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={inp} /></div>
            <div><label style={lbl}>Crie uma senha *</label><div style={{ position: 'relative' }}><input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 44 }} /><button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>{verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div></div>
            <button type="submit" disabled={loading} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.7 : 1, boxShadow: '0 8px 32px rgba(51,54,135,0.4)' }}>
              {loading ? 'Criando sua conta...' : '🚀 Aceitar convite e começar'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 20 }}>
            Já tem conta? <a href="/consultor/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>Entrar aqui</a>
          </p>
        </div>
      </section>
    </div>
  )
}
