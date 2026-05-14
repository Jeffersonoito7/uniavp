'use client'
import { useState } from 'react'
import VideoPlayer from './VideoPlayer'
import PhoneInput from './PhoneInput'
import { useRouter } from 'next/navigation'

type Etapa = 'pergunta1' | 'video' | 'pergunta2' | 'cadastro' | 'reprovado' | 'sucesso'

type Props = {
  gestorNome?: string
  gestorWhatsapp?: string
  siteNome?: string
  logoUrl?: string
  videoId?: string | null  // YouTube video ID do funil (admin config)
}

export default function FunilCaptacao({ gestorNome, gestorWhatsapp, siteNome, logoUrl, videoId }: Props) {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('pergunta1')
  const [videoAssistido, setVideoAssistido] = useState(false)
  const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        email: form.email,
        senha: form.senha,
        gestor_nome: gestorNome ?? '',
        gestor_whatsapp: gestorWhatsapp ?? '',
      }),
    })
    const data = await res.json()
    if (data.ok || data.aluno) {
      setEtapa('sucesso')
      setTimeout(() => router.push('/consultor/login'), 2500)
    } else {
      setErro(data.erro ?? data.error ?? 'Erro ao criar conta.')
    }
    setLoading(false)
  }

  const bg = 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)'
  const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }

  // ── 1. PERGUNTA INICIAL ─────────────────────────────────────────
  if (etapa === 'pergunta1') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
        <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
          {logoUrl && <img src={logoUrl} alt={siteNome} style={{ height: 64, objectFit: 'contain', marginBottom: 40 }} />}

          <div style={{ fontSize: 64, marginBottom: 24 }}>🤝</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Você gosta de vendas<br />ou deseja aprender<br />
            <span style={{ background: 'linear-gradient(90deg, #02A153, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>a vender?</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 48, lineHeight: 1.7 }}>
            {gestorNome
              ? `${gestorNome} está buscando pessoas com o perfil certo para integrar sua equipe.`
              : 'Estamos buscando pessoas com o perfil certo para integrar nosso time.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>
            <button
              onClick={() => setEtapa(videoId ? 'video' : 'pergunta2')}
              style={{ background: 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', border: 'none', borderRadius: 16, padding: '22px 40px', fontWeight: 900, fontSize: 20, cursor: 'pointer', boxShadow: '0 12px 40px rgba(2,161,83,0.4)', letterSpacing: 0.5, transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ✅ SIM, quero aprender!
            </button>
            <button
              onClick={() => setEtapa('reprovado')}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              Não, isso não é para mim
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 2. VÍDEO DE APRESENTAÇÃO ─────────────────────────────────────
  if (etapa === 'video' && videoId) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '32px 20px' }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {logoUrl && <img src={logoUrl} alt={siteNome} style={{ height: 48, objectFit: 'contain', marginBottom: 20 }} />}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              🎬 Vídeo obrigatório — assista até o fim
            </div>
            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
              Antes de se cadastrar, assista a apresentação completa
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
              🔒 Não é possível avançar o vídeo — assista do início ao fim
            </p>
          </div>

          <VideoPlayer
            youtubeId={videoId}
            bloquearAvancar
            onEnded={() => setVideoAssistido(true)}
          />

          {videoAssistido && (
            <div style={{ marginTop: 24, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <p style={{ color: '#22c55e', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
                Ótimo! Você assistiu ao vídeo completo.
              </p>
              <button
                onClick={() => setEtapa('pergunta2')}
                style={{ background: 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 48px', fontWeight: 800, fontSize: 18, cursor: 'pointer', boxShadow: '0 8px 32px rgba(2,161,83,0.4)' }}
              >
                Continuar →
              </button>
            </div>
          )}

          {!videoAssistido && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 16 }}>
              O botão "Continuar" aparece ao terminar o vídeo
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── 3. SEGUNDA PERGUNTA ──────────────────────────────────────────
  if (etapa === 'pergunta2') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🚀</div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 20 }}>
            Faz sentido para você começar o<br />
            <span style={{ background: 'linear-gradient(90deg, #3b82f6, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>processo de seleção e treinamento?</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 48, lineHeight: 1.7 }}>
            Se você assistiu ao vídeo e se identificou com a oportunidade, avance para criar sua conta e dar o próximo passo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>
            <button
              onClick={() => setEtapa('cadastro')}
              style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none', borderRadius: 16, padding: '22px 40px', fontWeight: 900, fontSize: 20, cursor: 'pointer', boxShadow: '0 12px 40px rgba(59,130,246,0.4)', letterSpacing: 0.5, transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ✅ SIM, quero me cadastrar!
            </button>
            <button
              onClick={() => setEtapa('reprovado')}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              Não, por enquanto não
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 4. FORMULÁRIO DE CADASTRO ─────────────────────────────────────
  if (etapa === 'cadastro') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {logoUrl && <img src={logoUrl} alt={siteNome} style={{ height: 56, objectFit: 'contain', marginBottom: 16 }} />}
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Crie sua conta agora</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>É gratuito — você terá acesso imediato à plataforma</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '32px 28px' }}>
            {erro && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 18 }}>
                {erro}
              </div>
            )}

            <form onSubmit={cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Seu nome completo *</label>
                <input type="text" placeholder="Como você se chama?" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Seu WhatsApp *</label>
                <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Seu melhor e-mail *</label>
                <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Crie uma senha *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verSenha ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 44 }} />
                  <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex' }}>
                    {verSenha
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              {/* Campos do gestor só aparecem se não vier de link de gestor */}
              {!gestorWhatsapp && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Gestor que te indicou</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input type="text" placeholder="Nome do gestor (opcional)" onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value } as typeof p))} style={inp} />
                    <PhoneInput value={''} onChange={v => setForm(p => ({ ...p, gestor_whatsapp: v } as typeof p))} placeholder="WhatsApp do gestor (opcional)" />
                  </div>
                </div>
              )}

              {gestorNome && (
                <div style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <div>
                    <p style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, margin: 0 }}>Indicado por</p>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>{gestorNome}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 32px rgba(59,130,246,0.4)', marginTop: 4 }}>
                {loading ? '⏳ Criando conta...' : '🚀 Iniciar minha formação'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 20 }}>
              Já tem conta? <a href="/consultor/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Entrar aqui</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── REPROVADO ────────────────────────────────────────────────────
  if (etapa === 'reprovado') {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 40 }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🙏</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Tudo bem!</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
            Obrigado pela honestidade. Se mudar de ideia no futuro, estaremos aqui.<br />
            Sucesso na sua jornada! 🚀
          </p>
          <button onClick={() => setEtapa('pergunta1')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}>
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  // ── SUCESSO ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 40 }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Cadastro realizado!</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>Redirecionando para o login...</p>
      </div>
    </div>
  )
}
