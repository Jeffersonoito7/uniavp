'use client'
import { useEffect, useState } from 'react'

export default function SiteLogoHeader({ height = 72 }: { height?: number }) {
  const [logoUrl, setLogoUrl] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setLogoUrl(d.logoUrl || '')
      setNome(d.nome || '')
    }).catch(() => {})
  }, [])

  if (logoUrl && !erro) {
    return (
      <img
        src={logoUrl}
        alt={nome}
        className="logo-site"
        style={{ height, objectFit: 'contain', display: 'block', margin: '0 auto' }}
        onError={() => setErro(true)}
      />
    )
  }

  if (nome) {
    return (
      <h1 style={{ fontSize: 22, fontWeight: 900, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', margin: 0 }}>
        {nome}
      </h1>
    )
  }

  return null
}
