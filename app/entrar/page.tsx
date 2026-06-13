'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TEMAS = {
 pro: {
 cardBorder: 'rgba(34,197,94,0.25)',
 btn: '#22c55e',
 linkColor: '#4ade80',
 badge: 'PRO',
 badgeColor: '#22c55e',
 label: 'Painel PRO',
 },
 free: {
 cardBorder: 'rgba(59,130,246,0.25)',
 btn: '#3b82f6',
 linkColor: '#60a5fa',
 badge: 'FREE',
 badgeColor: '#60a5fa',
 label: 'Painel FREE',
 },
 adm: {
 cardBorder: 'rgba(79,70,229,0.25)',
 btn: '#4f46e5',
 linkColor: '#818cf8',
 badge: 'Admin',
 badgeColor: '#818cf8',
 label: 'Painel Admin',
 },
 default: {
 cardBorder: 'rgba(79,70,229,0.2)',
 btn: '#4f46e5',
 linkColor: '#818cf8',
 badge: '',
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
 width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
 borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, outline: 'none',
 boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s',
 }

 return (
 <div style={{
 minHeight: '100vh',
 background: '#0a0a0f',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontFamily: 'Inter, sans-serif', padding: 20,
 }}>

 <div style={{ width: '100%', maxWidth: 400 }}>

 {/* Badge do painel */}
 {tema.badge && (
 <div style={{ textAlign: 'center', marginBottom: 16 }}>
 <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${tema.badgeColor}18`, border: `1px solid ${tema.badgeColor}35`, borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: tema.badgeColor }}>
 {tema.label}
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
 background: '#0f0f17',
 border: `1px solid ${tema.cardBorder}`,
 borderRadius: 14, padding: '32px 28px',
 boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
 }}>
 {erro && (
 <div className="alert alert-error" style={{ marginBottom: 20, textAlign: 'center', fontSize: 14 }}>
 {erro}
 </div>
 )}

 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>E-mail</label>
 <input type="email" autoComplete="email" placeholder="seu@email.com"
 value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
 required style={inp} />
 </div>

 <div>
 <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Senha</label>
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
 style={{ background: loading ? 'rgba(100,100,100,0.4)' : tema.btn, border: 'none', borderRadius: 8, padding: '12px', color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'opacity 0.15s', width: '100%', opacity: loading ? 0.7 : 1 }}>
 {loading ? 'Entrando...' : 'Entrar'}
 </button>
 </form>
 </div>

 {/* Rodapé */}
 {!tema.badge && (
 <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
 {[
 { label: 'FREE', color: '#60a5fa', href: '?p=free' },
 { label: 'PRO', color: '#4ade80', href: '?p=pro' },
 { label: 'Admin', color: '#818cf8', href: '?p=adm' },
 ].map(b => (
 <a key={b.label} href={b.href} style={{ fontSize: 12, color: b.color, fontWeight: 500, opacity: 0.55, textDecoration: 'none' }}>
 {b.label}
 </a>
 ))}
 </div>
 )}
 <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 10 }}>
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
