'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('avp-theme')
    if (saved === 'light') {
      document.documentElement.classList.add('light')
      setLight(true)
    }
  }, [])

  function toggle() {
    if (light) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('avp-theme', 'dark')
      setLight(false)
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('avp-theme', 'light')
      setLight(true)
    }
  }

  return (
    <button
      onClick={toggle}
      title={light ? 'Modo escuro' : 'Modo claro'}
      style={{
        background: 'var(--avp-card)',
        border: '1px solid var(--avp-border)',
        borderRadius: 8,
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 16,
        color: 'var(--avp-text)',
        flexShrink: 0,
      }}
    >
      {light ? '🌙' : '☀️'}
    </button>
  )
}
