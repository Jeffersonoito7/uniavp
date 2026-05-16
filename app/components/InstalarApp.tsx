'use client'
import { useEffect, useState } from 'react'

export default function InstalarApp() {
  const [prompt, setPrompt] = useState<any>(null)
  const [visivel, setVisivel] = useState(false)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    // Detecta se já está instalado como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Verifica se já dispensou antes
    if (sessionStorage.getItem('pwa_dispensado')) return

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
    if (outcome === 'accepted') setInstalado(true)
    setVisivel(false)
  }

  function dispensar() {
    sessionStorage.setItem('pwa_dispensado', '1')
    setVisivel(false)
  }

  if (!visivel || instalado) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: 400,
      background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
      borderRadius: 16, padding: '16px 20px', zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <span style={{ fontSize: 32, flexShrink: 0 }}>📲</span>
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
