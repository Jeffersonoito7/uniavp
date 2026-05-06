'use client'
import { useState, useEffect } from 'react'

export default function CountdownAoVivo({ aoVivoData, aoVivoLink, plataforma }: { aoVivoData: string; aoVivoLink: string; plataforma: string }) {
  const [diff, setDiff] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const target = new Date(aoVivoData).getTime()
    const update = () => setDiff(target - Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [aoVivoData])

  if (!mounted) return null

  const agora = Date.now()
  const target = new Date(aoVivoData).getTime()
  const TRINTA_MIN = 30 * 60 * 1000

  if (diff < -TRINTA_MIN) return null

  if (Math.abs(diff) <= TRINTA_MIN) {
    return (
      <a
        href={aoVivoLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--avp-green)', color: '#fff', borderRadius: 12, padding: '16px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 16, marginBottom: 24 }}
      >
        🔴 Entrar na Aula Ao Vivo — {plataforma.toUpperCase()}
      </a>
    )
  }

  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const fmt = (n: number) => String(n).padStart(2, '0')

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 4 }}>AULA AO VIVO — {new Date(aoVivoData).toLocaleString('pt-BR')}</p>
        <p style={{ fontWeight: 700, fontSize: 18 }}>
          {fmt(h)}:{fmt(m)}:{fmt(s)} para o início
        </p>
      </div>
      <span style={{ background: '#33368720', color: '#6366f1', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{plataforma.toUpperCase()}</span>
    </div>
  )
}
