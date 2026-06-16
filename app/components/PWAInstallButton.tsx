'use client'
import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'

export default function PWAInstallButton() {
 const [prompt, setPrompt] = useState<any>(null)
 const [installed, setInstalled] = useState(false)
 const [show, setShow] = useState(false)

 useEffect(() => {
 const handler = (e: any) => { e.preventDefault(); setPrompt(e); setShow(true) }
 const installedHandler = () => { setInstalled(true); setShow(false) }
 window.addEventListener('beforeinstallprompt', handler)
 window.addEventListener('appinstalled', installedHandler)
 if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
 return () => {
 window.removeEventListener('beforeinstallprompt', handler)
 window.removeEventListener('appinstalled', installedHandler)
 }
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
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(2,161,83,0.4)',
 background: 'rgba(2,161,83,0.12)', color: '#4ade80', cursor: 'pointer',
 }}>
 <Download size={15} />
 </button>
 )
}
