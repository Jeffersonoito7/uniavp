'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle({ collapsed = false, inline = false }: { collapsed?: boolean; inline?: boolean }) {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('avp-theme') === 'light'
    setLight(saved)
    document.documentElement.classList.toggle('light', saved)
  }, [])

  function toggle() {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('light', next)
    localStorage.setItem('avp-theme', next ? 'light' : 'dark')
  }

  // Versão inline: ícone pequeno para headers (painel aluno/free)
  if (inline) {
    return (
      <button
        onClick={toggle}
        title={light ? 'Modo escuro' : 'Modo claro'}
        style={{
          background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
          borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 15, flexShrink: 0,
        }}
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
