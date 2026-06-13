'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TEMAS = {
 pro: {
 bg: '#0a0a0f',
 glow1: 'rgba(34,197,94,0.12)',
 glow2: 'rgba(34,197,94,0.06)',
 cardBorder: 'rgba(34,197,94,0.2)',
 btn: '#22c55e',
 btnShadow: 'rgba(34,197,94,0.3)',
 linkColor: '#4ade80',
 badge: 'PRO',
 badgeIcon: '',
 badgeColor: '#22c55e',
 label: 'Painel PRO',
 },
 free: {
 bg: '#0a0a0f',
 glow1: 'rgba(59,130,246,0.12)',
 glow2: 'rgba(59,130,246,0.06)',
 cardBorder: 'rgba(59,130,246,0.2)',
 btn: '#3b82f6',
 btnShadow: 'rgba(59,130,246,0.3)',
 linkColor: '#60a5fa',
 badge: 'FREE',
 badgeIcon: '',
 badgeColor: '#60a5fa',
 label: 'Painel FREE',
 },
 adm: {
 bg: '#0a0a0f',
 glow1: 'rgba(99,102,241,0.1)',
 glow2: 'rgba(99,102,241,0.05)',
 cardBorder: 'rgba(99,102,241,0.2)',
 btn: '#4f46e5',
 btnShadow: 'rgba(99,102,241,0.3)',
 linkColor: '#818cf8',
 badge: 'Admin',
 badgeIcon: '',
 badgeColor: '#818cf8',
 label: 'Painel Admin',
 },
 default: {
 bg: '#0a0a0f',
 glow1: 'rgba(99,102,241,0.1)',
 glow2: 'rgba(34,197,94,0.06)',
 cardBorder: 'rgba(99,102,241,0.2)',
 btn: '#4f46e5',
 btnShadow: 'rgba(99,102,241,0.3)',
 linkColor: '#818cf8',
 badge: '',
 badgeIcon: '',
 badgeColor: '',
 label: '',
 },
}

function EntrarForm() {
 const searchParams = useSearchParams()
 const p = (searchParams.get('p') ?? 'default') as keyof typeof TEMAS
 const tema = TEMAS[p] ?? TEMAS.default

 const [form, setForm] = useState({ email: '', password: '' })
 const [loading, setLoading] = useState(false)
 const [erro, setErro] = useState('')
 const [verSenha, setVerSenha] = useState(false)
 const [logoUrl, setLogoUrl] = useState('')
 const [siteNome, setSiteNome] = useState('')

 useEffect(() => {
 fetch('/api/site-config').then(r => r.json()).then(d => {
 setLogoUrl(d.logoPaginaUrl || d.logoUrl || '')
 setSiteNome(d.nome || '')
 }).catch(() => {})
 }, [])

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 setLoading(true)
 setErro('')

 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 )

 const { error } = await supabase.auth.signInWithPassword({
 email: form.email.trim().toLowerCase(),
 password: form.password,
 })

 if (error) {
 setErro('E-mail ou senha incorretos.')
 setLoading(false)
 return
 }

 const res = await fetch('/api/auth/perfil')
 const perfil = await res.json()

 if (perfil.redirect) {
 window.location.href = perfil.redirect
 } else {
 await supabase.auth.signOut()
 setErro('Nenhuma conta encontrada com este e-mail.')
 setLoading(false)
 }
 }

 const inp: React.CSSProperties = {
 width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
 borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, outline: 'none',
 boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border 0.2s',
 }

 return (
 <div style={{
 minHeight: '100vh',
 background: tema.bg,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: 'Inter, sans-serif', padding: 20, position: 'relative', overflow: 'hidden',
 }}>
 <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: tema.glow1, filter: 'blur(80px)', pointerEvents: 'none' }} />
 <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: tema.glow2, filter: 'blur(80px)', pointerEvents: 'none' }} />

 <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

 {/* Badge do painel */}
 {tema.badge && (
 <div style={{ textAlign: 'center', marginBottom: 16 }}>
 <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${tema.badgeColor}18`, border: `1px solid ${tema.badgeColor}40`, borderRadius: 100, padding: '5px 16px', fontSize: 12, fontWeight: 800, color: tema.badgeColor, letterSpacing: 1, textTransform: 'uppercase' }}>
 {tema.badgeIcon} {tema.label}
 </span>
 </div>
 )}

 {/* Logo */}
 <div style={{ textAlign: 'center', marginBottom: 36 }}>
 {logoUrl ? (
 <img src={logoUrl} alt={siteNome}
 style={{ height: 68, width: 'auto', display: 'block', margin: '0 auto 12px', objectFit: 'contain' }} />
 ) : (
 <div style={{ fontSize: 44, marginBottom: 10 }}></div>
 )}
 {!logoUrl && siteNome && (
 <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 1 }}>{siteNome}</h1>
 )}
 <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>
 Acesse sua conta para continuar
 </p>
 </div>

 {/* Card */}
 <div style={{
 background: 'rgba(10,12,20,0.82)',
 border: `1px solid ${tema.cardBorder}`,
 borderRadius: 20, padding: '36px 32px',
 backdropFilter: 'blur(12px)',
 boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
 }}>
 {erro && (
 <div className="alert alert-error" style={{ marginBottom: 20, textAlign: 'center', fontSize: 14 }}>
 {erro}
 </div>
 )}

 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>E-mail</label>
 <input type="email" autoComplete="email" placeholder="seu@email.com"
 value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
 required style={inp} />
 </div>

 <div>
 <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 }}>Senha</label>
 <div style={{ position: 'relative' }}>
 <input type={verSenha ? 'text' : 'password'} autoComplete="current-password"
 placeholder="••••••••" value={form.password}
 onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
 required style={{ ...inp, paddingRight: 48 }} />
 <button type="button" onClick={() => setVerSenha(v => !v)}
 style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 0 }}>
 {verSenha
 ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
 : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
 }
 </button>
 </div>
 </div>

 <div style={{ textAlign: 'right', marginTop: -8 }}>
 <a href="/recuperar-senha" style={{ color: tema.linkColor, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
 Esqueci minha senha
 </a>
 </div>

 <button type="submit" disabled={loading}
 style={{ background: loading ? 'rgba(100,100,100,0.4)' : tema.btn, border: 'none', borderRadius: 12, padding: '15px', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background 0.2s', width: '100%' }}>
 {loading ? 'Entrando...' : 'Entrar →'}
 </button>
 </form>
 </div>

 {/* Rodapé */}
 {!tema.badge && (
 <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
 {[
 { icon: '🆓', label: 'FREE', color: '#60a5fa', href: '?p=free' },
 { icon: '', label: 'PRO', color: '#22c55e', href: '?p=pro' },
 { icon: '', label: 'Admin', color: '#818cf8', href: '?p=adm' },
 ].map(b => (
 <a key={b.label} href={b.href} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: b.color, fontWeight: 600, opacity: 0.5, textDecoration: 'none' }}>
 <span>{b.icon}</span><span>{b.label}</span>
 </a>
 ))}
 </div>
 )}
 <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: 10 }}>
 Um único acesso para todos os painéis
 </p>
 </div>
 </div>
 )
}

export default function EntrarPage() {
 return (
 <Suspense fallback={
 <div style={{ minHeight: '100vh', background: '#020d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}> Carregando...</div>
 </div>
 }>
 <EntrarForm />
 </Suspense>
 )
}
