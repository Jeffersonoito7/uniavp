'use client'
import { useEffect, useState } from 'react'

const LIGHT_VARS: Record<string, string> = {
  '--avp-black': '#f1f5f9',
  '--avp-dark': '#e2e8f0',
  '--avp-card': '#ffffff',
  '--avp-card-hover': '#f8fafc',
  '--avp-border': '#cbd5e1',
  '--avp-text': '#0f172a',
  '--avp-text-dim': '#475569',
  '--avp-header-bg': 'rgba(241,245,249,0.97)',
  '--avp-sidebar': '#ffffff',
}

function applyTheme(isLight: boolean) {
  const el = document.documentElement
  el.classList.toggle('light', isLight)
  if (isLight) {
    Object.entries(LIGHT_VARS).forEach(([k, v]) => el.style.setProperty(k, v))
  } else {
    Object.keys(LIGHT_VARS).forEach(k => el.style.removeProperty(k))
  }
}

export default function ThemeToggle({ collapsed = false, inline = false }: { collapsed?: boolean; inline?: boolean }) {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('avp-theme') === 'light'
    setLight(saved)
    applyTheme(saved)
  }, [])

  function toggle() {
    const next = !light
    setLight(next)
    applyTheme(next)
    localStorage.setItem('avp-theme', next ? 'light' : 'dark')
  }

  // Versão inline: ícone pequeno discreto para headers e topo de sidebar
  if (inline) {
    return (
      <button
        onClick={toggle}
        title={light ? 'Modo escuro' : 'Modo claro'}
        style={{
          background: 'none', border: 'none',
          borderRadius: 6, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 14, flexShrink: 0,
          color: 'var(--avp-text-dim)', opacity: 0.7,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
      >
        {light ? '🌙' : '☀️'}
      </button>
    )
  }

  // Versão sidebar: comporta colapsado/expandido
  return (
    <button
      onClick={toggle}
      title={light ? 'Alternar para modo escuro' : 'Alternar para modo claro'}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 8,
        width: '100%',
        background: light ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)',
        border: light ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(99,102,241,0.3)',
        color: light ? '#fbbf24' : '#818cf8',
        cursor: 'pointer',
        padding: collapsed ? '10px 0' : '8px 12px',
        borderRadius: 8, fontSize: 13, fontWeight: 600,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = light ? 'rgba(251,191,36,0.22)' : 'rgba(99,102,241,0.22)' }}
      onMouseLeave={e => { e.currentTarget.style.background = light ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)' }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{light ? '☀️' : '🌙'}</span>
      {!collapsed && <span>{light ? 'Modo claro' : 'Modo escuro'}</span>}
    </button>
  )
}
