'use client'
import { useState, useEffect, useRef } from 'react'
import VideoPlayer from './VideoPlayer'
import PhoneInput from './PhoneInput'
import { useRouter } from 'next/navigation'
import { HelpCircle, Link2, Smartphone, CheckCircle2 } from 'lucide-react'

type Etapa = 'pergunta1' | 'video' | 'pergunta2' | 'cadastro' | 'reprovado' | 'sucesso' | 'passo_parceiro' | 'passo_app'

type Props = {
 gestorNome?: string
 gestorWhatsapp?: string
 siteNome?: string
 logoUrl?: string
 corFundo?: string
 videoId?: string | null
 direto?: boolean
 indicadorWhatsapp?: string
 plano?: 'pro'
 linkExterno?: string
 bloquearVideo?: boolean
 // Passo 1 — sistema parceiro
 captacaoMostrarParceiro?: boolean
 captacaoBloquearParceiro?: boolean
 captacaoParceiroTitulo?: string
 // Passo 2 — download do app
 captacaoMostrarApp?: boolean
 captacaoBloquearApp?: boolean
 appIosUrl?: string
 appAndroidUrl?: string
}

export default function FunilCaptacao({
 gestorNome, gestorWhatsapp, siteNome, logoUrl, corFundo, videoId, direto, indicadorWhatsapp, plano,
 linkExterno, bloquearVideo = true,
 captacaoMostrarParceiro = false, captacaoBloquearParceiro = false, captacaoParceiroTitulo,
 captacaoMostrarApp = false, captacaoBloquearApp = false,
 appIosUrl, appAndroidUrl,
}: Props) {
 const router = useRouter()
 const [etapa, setEtapa] = useState<Etapa>(direto ? 'cadastro' : 'pergunta1')
 const [videoAssistido, setVideoAssistido] = useState(false)
 const btnContinuarRef = useRef<HTMLDivElement>(null)
 const [form, setForm] = useState({ nome: '', whatsapp: '', email: '', senha: '', gestor_nome: '', gestor_whatsapp: '' })

 useEffect(() => {
 if (etapa !== 'video') window.scrollTo({ top: 0, behavior: 'instant' })
 }, [etapa])

 useEffect(() => {
 if (videoAssistido && btnContinuarRef.current) {
 setTimeout(() => {
 btnContinuarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
 }, 300)
 }
 }, [videoAssistido])
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
 gestor_nome: gestorWhatsapp ? (gestorNome ?? '') : (form.gestor_nome || ''),
 gestor_whatsapp: gestorWhatsapp ? gestorWhatsapp : (form.gestor_whatsapp.replace(/\D/g, '') || ''),
 indicador_whatsapp: indicadorWhatsapp ?? undefined,
 }),
 })
 const data = await res.json()
 if (data.ok || data.aluno) {
 // Sequência pós-cadastro: parceiro → app → login
 if (captacaoMostrarParceiro) {
 setEtapa('passo_parceiro')
 } else if (captacaoMostrarApp && (appIosUrl || appAndroidUrl)) {
 setEtapa('passo_app')
 } else {
 setEtapa('sucesso')
 setTimeout(() => router.push(plano === 'pro' ? '/assinar-pro' : '/entrar'), 2500)
 }
 } else {
 setErro(data.erro ?? data.error ?? 'Erro ao criar conta.')
 }
 setLoading(false)
 }

 const bg = corFundo || '#0a0a0f'
 const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }

 // ── 1. PERGUNTA INICIAL ─────────────────────────────────────────
 if (etapa === 'pergunta1') {
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
 <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
 <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 52 }}>
 {logoUrl
 ? <img src={logoUrl} alt={siteNome} style={{ height: 160, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' }} />
 : <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: 2 }}>{siteNome}</span>}
 </div>

 <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
 Você gosta de vendas<br />ou deseja aprender<br />
 <span style={{ color: '#4ade80' }}>a vender?</span>
 </h1>
 <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 48, lineHeight: 1.7 }}>
 {siteNome
 ? `${siteNome} está selecionando novos consultores.`
 : 'Estamos selecionando novos consultores.'}
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>
 <button
 onClick={() => setEtapa(videoId ? 'video' : 'pergunta2')}
 className="btn btn-green btn-full" style={{ fontSize: 20, borderRadius: 16, padding: '22px 40px', transition: 'transform 0.15s' }}
 onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
 onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
>
 SIM, quero aprender!
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
 <>
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', fontFamily: 'Inter, sans-serif', padding: '12px 20px 140px' }}>
 <div style={{ maxWidth: 800, width: '100%' }}>
 <div style={{ textAlign: 'center', marginBottom: 10 }}>
 {logoUrl && <img src={logoUrl} alt={siteNome} style={{ height: 32, objectFit: 'contain', marginBottom: 8 }} />}
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
 Vídeo obrigatório — assista até o fim
 </div>
 <h2 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
 Antes de se cadastrar, assista a apresentação completa
 </h2>
 </div>

 <VideoPlayer
 youtubeId={videoId}
 bloquearAvancar={bloquearVideo}
 onEnded={() => setVideoAssistido(true)}
 />

 {!videoAssistido && (
 <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 10 }}>
 O botão "Continuar" aparece ao terminar o vídeo
 </p>
 )}

 {/* Botão inline abaixo do vídeo — aparece quando termina */}
 <div ref={btnContinuarRef} style={{ marginTop: 32, minHeight: videoAssistido ? undefined : 0 }}>
 {videoAssistido && (
 <div style={{
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
 animation: 'slideUp 0.4s ease',
 background: 'rgba(34,197,94,0.07)', border: '1.5px solid rgba(34,197,94,0.3)',
 borderRadius: 16, padding: '24px 20px',
 }}>
 <p style={{ color: '#22c55e', fontSize: 15, fontWeight: 700, margin: 0, textAlign: 'center' }}>
 Ótimo! Você assistiu ao vídeo completo.
 </p>
 <button
 onClick={() => setEtapa('pergunta2')}
 className="btn btn-green btn-full" style={{ fontSize: 18, borderRadius: 14, padding: '18px 0', maxWidth: 480 }}
>
 Continuar →
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
 </>
 )
 }

 // ── 3. SEGUNDA PERGUNTA ──────────────────────────────────────────
 if (etapa === 'pergunta2') {
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
 <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
 <HelpCircle size={52} style={{ color: '#818cf8', marginBottom: 20 }} />
 <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 20 }}>
 Faz sentido para você começar o<br />
 <span style={{ color: '#818cf8' }}>processo de seleção e treinamento?</span>
 </h1>
 <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 48, lineHeight: 1.7 }}>
 {videoId ? 'Assistiu ao vídeo e quer fazer parte? Crie sua conta.' : 'Pronto para começar? Crie sua conta agora.'}
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>
 <button
 onClick={() => setEtapa('cadastro')}
 className="btn btn-wpp btn-full" style={{ fontSize: 20, borderRadius: 16, padding: '22px 40px', transition: 'transform 0.15s' }}
 onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
 onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
>
 SIM, quero iniciar!
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
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
 <div style={{ maxWidth: 520, width: '100%' }}>
 <div style={{ textAlign: 'center', marginBottom: 32 }}>
 <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
 {logoUrl
 ? <img src={logoUrl} alt={siteNome} style={{ height: 140, objectFit: 'contain', filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' }} />
 : <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: 2 }}>{siteNome}</span>}
 </div>
 <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Crie sua conta agora</h2>
 <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>É gratuito. Acesso imediato.</p>
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

 {/* Só aparece se não veio pelo link direto de um PRO ou indicador já conhecido */}
 {!gestorWhatsapp && !indicadorWhatsapp && (
 <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
 <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
 Quem te indicou? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
 </label>
 <PhoneInput value={form.gestor_whatsapp} onChange={v => setForm(p => ({ ...p, gestor_whatsapp: v }))} placeholder="WhatsApp de quem te indicou" />
 <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
 Se alguém te indicou, informe o WhatsApp dessa pessoa
 </p>
 </div>
 )}

 {gestorNome && (
 <div style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid rgba(2,161,83,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
 <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
 <div>
 <p style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, margin: 0 }}>Indicado por</p>
 <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>{gestorNome}</p>
 </div>
 </div>
 )}

 <button type="submit" disabled={loading}
 className="btn btn-full btn-lg" style={{ marginTop: 4, background: plano === 'pro' ? '#4f46e5' : '#3b82f6', fontSize: 16 }}>
 {loading ? 'Criando conta...' : plano === 'pro' ? 'Criar conta e ir para o pagamento PRO' : 'Iniciar minha formação'}
 </button>
 </form>

 <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 20 }}>
 Já tem conta? <a href="/entrar?p=free" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Entrar aqui</a>
 </p>
 </div>
 </div>
 </div>
 )
 }

 // ── REPROVADO ────────────────────────────────────────────────────
 if (etapa === 'reprovado') {
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 40 }}>
 <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
 <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Tudo bem!</h2>
 <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
 Se mudar de ideia, o cadastro está disponível aqui.
 </p>
 <button onClick={() => setEtapa('pergunta1')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '10px 24px', cursor: 'pointer', fontSize: 14 }}>
 ← Voltar
 </button>
 </div>
 </div>
 )
 }

 const btnParceiroTitulo = captacaoParceiroTitulo || 'Cadastrar no sistema parceiro'
 const temApp = !!(appIosUrl || appAndroidUrl)
 const destino = plano === 'pro' ? '/assinar-pro' : '/entrar'

 function avancarParaApp() {
 if (captacaoMostrarApp && temApp) {
 setEtapa('passo_app')
 } else {
 setEtapa('sucesso')
 setTimeout(() => router.push(destino), 2500)
 }
 }

 function avancarParaLogin() {
 setEtapa('sucesso')
 setTimeout(() => router.push(destino), 2000)
 }

 // ── PASSO 1: CADASTRO NO SISTEMA PARCEIRO ────────────────────────
 if (etapa === 'passo_parceiro') {
 const total = (captacaoMostrarParceiro ? 1 : 0) + (captacaoMostrarApp && temApp ? 1 : 0)
 const atual = 1
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
 <div style={{ textAlign: 'center', color: '#fff', maxWidth: 540, width: '100%' }}>
 {total> 1 && (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
 {Array.from({ length: total }, (_, i) => (
 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === atual - 1 ? '#02A153' : i < atual - 1 ? '#02A153' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
 {i < atual - 1 ? '' : i + 1}
 </div>
 {i < total - 1 && <div style={{ width: 40, height: 2, background: i < atual - 1 ? '#02A153' : 'rgba(255,255,255,0.15)' }} />}
 </div>
 ))}
 </div>
 )}

 <Link2 size={48} style={{ color: '#02A153', marginBottom: 14 }} />
 <p style={{ fontSize: 12, fontWeight: 700, color: '#02A153', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
 {total> 1 ? `Passo ${atual} de ${total}` : 'Próximo passo'}
 </p>
 <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Cadastre-se no Sistema Parceiro</h2>
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
 Sua conta na plataforma foi criada. Agora você precisa se cadastrar também no sistema do seu gestor para ativar seu acesso completo.
 </p>

 <div style={{ background: 'rgba(2,161,83,0.08)', border: '2px solid rgba(2,161,83,0.4)', borderRadius: 20, padding: '28px 24px', marginBottom: 20 }}>
 {linkExterno ? (
 <a href={linkExterno} target="_blank" rel="noopener noreferrer"
 onClick={() => { if (!captacaoBloquearParceiro) setTimeout(avancarParaApp, 1000) }}
 className="btn btn-green btn-full" style={{ textDecoration: 'none', fontSize: 18, borderRadius: 14, padding: '18px 32px', marginBottom: 14 }}>
 {btnParceiroTitulo} →
 </a>
 ) : (
 <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 14, lineHeight: 1.6 }}>
 Solicite o link de cadastro ao seu gestor e acesse o sistema parceiro antes de continuar.
 </p>
 )}
 <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
 {captacaoBloquearParceiro && linkExterno ? 'Clique para acessar. Depois volte aqui para continuar.' : linkExterno ? 'Abre em nova aba automaticamente' : ''}
 </p>
 </div>

 {(!captacaoBloquearParceiro || !linkExterno) && (
 <button onClick={avancarParaApp} className="btn btn-green btn-full" style={{ fontSize: 15 }}>
 {linkExterno ? 'Já me cadastrei → Continuar' : 'Continuar →'}
 </button>
 )}
 {captacaoBloquearParceiro && linkExterno && (
 <button onClick={avancarParaApp} className="btn btn-ghost btn-full" style={{ fontSize: 15 }}>
 Já me cadastrei → Continuar
 </button>
 )}
 </div>
 </div>
 )
 }

 // ── PASSO 2: BAIXAR O APLICATIVO ─────────────────────────────────
 if (etapa === 'passo_app' && temApp) {
 const total = (captacaoMostrarParceiro ? 1 : 0) + (captacaoMostrarApp && temApp ? 1 : 0)
 const atual = captacaoMostrarParceiro ? 2 : 1
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
 <div style={{ textAlign: 'center', color: '#fff', maxWidth: 540, width: '100%' }}>
 {/* Indicador de passos */}
 {total> 1 && (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
 {Array.from({ length: total }, (_, i) => (
 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < atual - 1 ? '#02A153' : i === atual - 1 ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
 {i < atual - 1 ? '' : i + 1}
 </div>
 {i < total - 1 && <div style={{ width: 40, height: 2, background: i < atual - 1 ? '#02A153' : 'rgba(255,255,255,0.15)' }} />}
 </div>
 ))}
 </div>
 )}

 <Smartphone size={48} style={{ color: '#6366f1', marginBottom: 14 }} />
 <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
 {total> 1 ? `Passo ${atual} de ${total}` : 'Próximo passo'}
 </p>
 <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Baixe o App do Consultor</h2>
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
 Instale o aplicativo para acompanhar indicações, comissões e métricas em tempo real.
 </p>

 <div style={{ background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.35)', borderRadius: 20, padding: '28px 24px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
 {appIosUrl && (
 <a href={appIosUrl} target="_blank" rel="noopener noreferrer"
 onClick={() => { if (!captacaoBloquearApp) setTimeout(avancarParaLogin, 800) }}
 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#000', color: '#fff', borderRadius: 14, padding: '16px 24px', fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
 <span>Baixar na App Store<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>iOS / iPhone</span></span>
 </a>
 )}
 {appAndroidUrl && (
 <a href={appAndroidUrl} target="_blank" rel="noopener noreferrer"
 onClick={() => { if (!captacaoBloquearApp) setTimeout(avancarParaLogin, 800) }}
 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#01875f', color: '#fff', borderRadius: 14, padding: '16px 24px', fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 4px 16px rgba(1,135,95,0.4)' }}>
 <span>Baixar no Google Play<br /><span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>Android</span></span>
 </a>
 )}
 <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
 {captacaoBloquearApp ? 'Baixe o app e depois clique em continuar abaixo.' : 'Após baixar, você será redirecionado automaticamente.'}
 </p>
 </div>

 {captacaoBloquearApp && (
 <button onClick={avancarParaLogin}
 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }}>
 Já baixei o app → Ir para o login
 </button>
 )}
 </div>
 </div>
 )
 }

 // ── SUCESSO FINAL ─────────────────────────────────────────────────
 return (
 <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 40 }}>
 <div style={{ textAlign: 'center', color: '#fff', maxWidth: 480, width: '100%' }}>
 <CheckCircle2 size={64} style={{ color: '#02A153', marginBottom: 18 }} />
 <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Tudo pronto!</h2>
 <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 28, lineHeight: 1.7 }}>
 Cadastro e configurações concluídos. Redirecionando para o login...
 </p>
 <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto', overflow: 'hidden' }}>
 <div style={{ height: '100%', background: '#02A153', borderRadius: 2, animation: 'progress 2s linear forwards' }} />
 </div>
 <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
 </div>
 </div>
 )
}
