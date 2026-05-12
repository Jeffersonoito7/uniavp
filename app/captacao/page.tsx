'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SiteLogoHeader from '@/app/components/SiteLogoHeader'
import PhoneInput from '@/app/components/PhoneInput'
import QualificacaoStep from '@/app/components/QualificacaoStep'

export default function CaptacaoPage() {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [qualificado, setQualificado] = useState(false)
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '', gestor_nome: '', gestor_whatsapp: '' })
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
      body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, ''), gestor_whatsapp: form.gestor_whatsapp.replace(/\D/g, '') }),
    })
    const data = await res.json()
    if (data.ok || data.aluno) {
      setSucesso('Conta criada com sucesso! Redirecionando...')
      setTimeout(() => router.push('/consultor/login'), 1800)
    } else {
      setErro(data.erro ?? data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }

  const depoimentos = [
    {
      nome: 'Cassio Greg',
      cargo: 'Consultor AVP',
      texto: 'Essa UniAVP não só me fez entender o quão potencial eu tenho. Mas também aprendi a influenciar positivamente outras pessoas a irem para o próximo nível! Eu já quero as próximas UniAVP!!!',
      emoji: '⭐⭐⭐⭐⭐',
    },
    {
      nome: 'Josadak Everton',
      cargo: 'Consultor AVP',
      texto: 'Posso falar com sinceridade: a UNIAVP tem mudado minha mentalidade. Profissionalismo, abordagem e liderança… Hoje eu conto os dias para estar nas reuniões. A Universidade AVP veio para separar quem realmente quer crescer… de quem só quer brincar.',
      emoji: '⭐⭐⭐⭐⭐',
    },
    {
      nome: 'Alisson Silva',
      cargo: 'Consultor AVP',
      texto: 'Essa Uniavp fez eu acreditar muito mais no meu potencial. Nos mostrou que experiência juntada com técnica alavanca muito mais o resultado. No dia após nosso retorno já conquistei um iPhone 17 Pro e uma Carta de Crédito para minha casa dos sonhos! Estou na terra prometida. 🚀',
      emoji: '⭐⭐⭐⭐⭐',
    },
    {
      nome: 'Thallis Guttemberg',
      cargo: 'Consultor AVP',
      texto: 'Depois da UNIAVP tomei a decisão de fazer Autovale de forma profissional. O que antes era dúvida hoje se tornou certeza.',
      emoji: '⭐⭐⭐⭐⭐',
    },
  ]


  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', fontFamily: 'Inter, sans-serif', color: 'var(--avp-text)' }}>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(48px,8vw,80px) 20px clamp(40px,6vw,60px)', background: 'radial-gradient(ellipse at 50% 0%, rgba(51,54,135,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(2,161,83,0.2) 0%, transparent 50%), var(--avp-black)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(51,54,135,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(2,161,83,0.05) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 16 }}>
            <SiteLogoHeader height={90} />
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: 'var(--avp-green)', letterSpacing: 2, textTransform: 'uppercase' }}>
              🏆 A Única e Mais Completa do País
            </div>
          </div>
          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 400, color: 'var(--avp-text-dim)', marginBottom: 24, lineHeight: 1.5 }}>
            Forme-se consultor de sucesso e conquiste sua <strong style={{ color: 'var(--avp-text)' }}>independência financeira</strong>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--avp-text-dim)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Treinamento 100% online com módulos práticos, quizzes de fixação, certificado oficial e suporte completo. Comece hoje e em poucas semanas estará pronto para atuar no mercado.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToForm} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 40px', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 32px rgba(51,54,135,0.4)', letterSpacing: 0.5 }}>
              🚀 Quero me formar agora
            </button>
            <a href="/consultor/login" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 12, padding: '16px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(59,130,246,0.25)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3b82f6' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(59,130,246,0.15)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(59,130,246,0.4)' }}>
              🎓 Já sou consultor →
            </a>
          </div>
        </div>
      </section>


      {/* BENEFÍCIOS */}
      <section style={{ padding: 'clamp(40px,7vw,80px) 20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Por que escolher a <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Uni AVP</span>?</h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 16 }}>A formação mais completa para consultores de proteção veicular do país</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
          {[
            { icon: '📱', titulo: '100% Online e Gratuito', desc: 'Acesse pelo celular ou computador, a qualquer hora, de qualquer lugar do Brasil' },
            { icon: '🎓', titulo: 'Certificado Oficial AVP', desc: 'Comprove sua qualificação com o certificado reconhecido pela Auto Vale Prevenções' },
            { icon: '🏆', titulo: 'Gamificação e Medalhas', desc: 'Ganhe pontos, conquiste medalhas e troque por prêmios ao longo da sua formação' },
            { icon: '💬', titulo: 'Suporte e Comunidade', desc: 'Fórum exclusivo e comentários nas aulas para tirar dúvidas com outros consultores' },
            { icon: '📊', titulo: 'Trilha Estruturada', desc: 'Módulos em sequência lógica com avaliações que garantem seu aprendizado real' },
            { icon: '🔔', titulo: 'Acompanhamento do Gestor', desc: 'Seu gestor recebe notificações do seu progresso e te apoia em cada etapa' },
          ].map(b => (
            <div key={b.titulo} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad-brand)' }} />
              <div style={{ fontSize: 36, marginBottom: 14 }}>{b.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{b.titulo}</h3>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section style={{ padding: '60px 24px 80px', background: 'linear-gradient(180deg, rgba(51,54,135,0.08) 0%, rgba(8,9,13,0) 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>O que dizem nossos consultores</h2>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>Histórias reais de transformação profissional</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 16 }}>
            {depoimentos.map(d => (
              <div key={d.nome} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 14, marginBottom: 12 }}>{d.emoji}</div>
                <p style={{ fontSize: 14, color: 'var(--avp-text-dim)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>"{d.texto}"</p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.nome}</div>
                  <div style={{ color: 'var(--avp-green)', fontSize: 12, fontWeight: 500 }}>{d.cargo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section ref={formRef} style={{ padding: '40px 24px 100px', maxWidth: 560, margin: '0 auto' }}>
        {!qualificado ? (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 40, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <QualificacaoStep onAprovado={() => setQualificado(true)} />
          </div>
        ) : (
        <>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Comece sua jornada <span style={{ background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>agora</span></h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>É gratuito. Sem cartão de crédito. Sem burocracia.</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 40, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
          {erro && <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 8, padding: '10px 14px', color: '#e63946', fontSize: 14, marginBottom: 16 }}>{erro}</div>}
          {sucesso && <div style={{ background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>{sucesso}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Seu nome completo *</label><input type="text" placeholder="Como você se chama?" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required style={inp} /></div>
            <div><label style={lbl}>Seu WhatsApp *</label><PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required /></div>
            <div><label style={lbl}>Seu melhor e-mail *</label><input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={inp} /></div>
            <div><label style={lbl}>Crie uma senha *</label><div style={{ position: 'relative' }}><input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 44 }} /><button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>{verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div></div>
            <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, marginTop: 4 }}>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Dados do seu gestor</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={lbl}>Nome do gestor que te indicou *</label><input type="text" placeholder="Nome do gestor" value={form.gestor_nome} onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value }))} required style={inp} /></div>
                <div><label style={lbl}>WhatsApp do gestor *</label><PhoneInput value={form.gestor_whatsapp} onChange={v => setForm(p => ({ ...p, gestor_whatsapp: v }))} required placeholder="WhatsApp do seu gestor" /></div>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 800, fontSize: 16, cursor: 'pointer', marginTop: 8, opacity: loading ? 0.7 : 1, boxShadow: '0 8px 32px rgba(51,54,135,0.4)', letterSpacing: 0.5 }}>
              {loading ? 'Criando sua conta...' : '🚀 Iniciar minha formação'}
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 20 }}>
            Já tem conta? <a href="/consultor/login" style={{ color: 'var(--avp-green)', textDecoration: 'none', fontWeight: 600 }}>Entrar aqui</a>
          </p>
        </div>
        </>
        )}
      </section>

    </div>
  )
}
