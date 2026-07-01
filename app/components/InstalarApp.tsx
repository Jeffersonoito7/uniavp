'use client'
import { useEffect, useState } from 'react'

export default function InstalarApp() {
 const [prompt, setPrompt] = useState<any>(null)
 const [visivel, setVisivel] = useState(false)
 const [isIos, setIsIos] = useState(false)
 const [instalado, setInstalado] = useState(false)

 useEffect(() => {
 if (window.matchMedia('(display-mode: standalone)').matches) return

 // Verifica se foi dispensado hoje
 const dispensadoEm = localStorage.getItem('pwa_dispensado_em')
 if (dispensadoEm) {
 const hoje = new Date().toISOString().slice(0, 10)
 if (dispensadoEm >= hoje) return
 }

 const path = window.location.pathname
 if (path.startsWith('/captacao') || path.startsWith('/g/') || path.startsWith('/c/')) return

 const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
 if (ios) {
 setIsIos(true)
 setVisivel(true)
 return
 }

 const handler = (e: Event) => {
 e.preventDefault()
 setPrompt(e)
 setVisivel(true)
 }
 window.addEventListener('beforeinstallprompt', handler as any)
 return () => window.removeEventListener('beforeinstallprompt', handler as any)
 }, [])

 async function instalar() {
 if (!prompt) return
 prompt.prompt()
 const { outcome } = await prompt.userChoice
 if (outcome === 'accepted') {
 setInstalado(true)
 localStorage.setItem('pwa_instalado', '1')
 }
 setVisivel(false)
 }

 function dispensar() {
 const hoje = new Date().toISOString().slice(0, 10)
 localStorage.setItem('pwa_dispensado_em', hoje)
 setVisivel(false)
 }

 if (!visivel || instalado) return null

 const base: React.CSSProperties = {
 position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
 width: 'calc(100% - 32px)', maxWidth: 400, zIndex: 9999,
 background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
 borderRadius: 16, padding: '16px 20px',
 boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
 }

 if (isIos) {
 return (
 <div style={base}>
 <button onClick={dispensar} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
 <span style={{ fontSize: 28, flexShrink: 0 }}></span>
 <div>
 <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Instalar como app</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Acesse direto da sua tela inicial</p>
 </div>
 </div>
 <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <span style={{ fontSize: 14 }}>1</span>
 </div>
 <p style={{ fontSize: 13, color: 'var(--avp-text)', margin: 0 }}>
 Toque no botão <strong>Compartilhar</strong>
 <svg style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
 </p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <span style={{ fontSize: 14 }}>2</span>
 </div>
 <p style={{ fontSize: 13, color: 'var(--avp-text)', margin: 0 }}>
 Role e toque em <strong>"Adicionar à Tela de Início"</strong>
 </p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <span style={{ fontSize: 14 }}>3</span>
 </div>
 <p style={{ fontSize: 13, color: 'var(--avp-text)', margin: 0 }}>
 Confirme tocando em <strong>"Adicionar"</strong>
 </p>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div style={{ ...base, display: 'flex', alignItems: 'center', gap: 14 }}>
 <span style={{ fontSize: 32, flexShrink: 0 }}></span>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Instalar como app</p>
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.4 }}>
 Acesse mais rápido direto da sua tela inicial.
 </p>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
 <button onClick={instalar}
 style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
 Instalar
 </button>
 <button onClick={dispensar}
 style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 11, cursor: 'pointer', padding: '2px 0' }}>
 Agora não
 </button>
 </div>
 </div>
 )
}
