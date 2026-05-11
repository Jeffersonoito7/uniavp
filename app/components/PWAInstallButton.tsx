'use client'
import { useState, useEffect } from 'react'

export default function PWAInstallButton() {
  const [prompt, setPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false) })
    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (installed || !show || !prompt) return null

  return (
    <button
      onClick={async () => {
        prompt.prompt()
        const { outcome } = await prompt.userChoice
        if (outcome === 'accepted') setInstalled(true)
        setShow(false)
      }}
      title="Instalar app"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(2,161,83,0.15)', border: '1px solid rgba(2,161,83,0.4)',
        color: '#4ade80', borderRadius: 8, padding: '6px 12px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
      📲 Instalar
    </button>
  )
}
