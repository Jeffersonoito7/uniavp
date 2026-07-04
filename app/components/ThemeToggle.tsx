'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'dark' | 'light' | 'system'

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

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveIsLight(mode: ThemeMode): boolean {
  if (mode === 'light') return true
  if (mode === 'dark') return false
  return !getSystemPrefersDark()
}

function applyTheme(mode: ThemeMode) {
  const isLight = resolveIsLight(mode)
  const el = document.documentElement
  el.classList.toggle('light', isLight)
  if (isLight) {
    Object.entries(LIGHT_VARS).forEach(([k, v]) => el.style.setProperty(k, v))
  } else {
    Object.keys(LIGHT_VARS).forEach(k => el.style.removeProperty(k))
  }
}

function cycleMode(current: ThemeMode): ThemeMode {
  if (current === 'dark') return 'light'
  if (current === 'light') return 'system'
  return 'dark'
}

const MODE_CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string; next: string }> = {
  dark:   { icon: <Moon size={14} />,    label: 'Escuro',  next: 'Claro' },
  light:  { icon: <Sun size={14} />,     label: 'Claro',   next: 'Sistema' },
  system: { icon: <Monitor size={14} />, label: 'Sistema', next: 'Escuro' },
}

const MODE_CONFIG_INLINE: Record<ThemeMode, { icon: React.ReactNode; title: string }> = {
  dark:   { icon: <Moon size={15} />,    title: 'Modo escuro — clique para Claro' },
  light:  { icon: <Sun size={15} />,     title: 'Modo claro — clique para Sistema' },
  system: { icon: <Monitor size={15} />, title: 'Modo sistema — clique para Escuro' },
}

export default function ThemeToggle({ collapsed = false, inline = false }: { collapsed?: boolean; inline?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('avp-theme') as ThemeMode | null) ?? 'dark'
    const valid: ThemeMode[] = ['dark', 'light', 'system']
    const resolved: ThemeMode = valid.includes(saved) ? saved : 'dark'
    setMode(resolved)
    applyTheme(resolved)

    if (resolved === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [])

  function toggle() {
    const next = cycleMode(mode)
    setMode(next)
    applyTheme(next)
    localStorage.setItem('avp-theme', next)
  }

  if (inline) {
    const { icon, title } = MODE_CONFIG_INLINE[mode]
    return (
      <button
        onClick={toggle}
        title={title}
        style={{
          background: 'none', border: 'none',
          borderRadius: 6, width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          color: 'var(--avp-text-dim)', opacity: 0.7,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
      >
        {icon}
      </button>
    )
  }

  const { icon, label } = MODE_CONFIG[mode]
  const bgMap: Record<ThemeMode, string> = {
    dark:   'rgba(99,102,241,0.12)',
    light:  'rgba(251,191,36,0.12)',
    system: 'rgba(148,163,184,0.12)',
  }
  const bgHoverMap: Record<ThemeMode, string> = {
    dark:   'rgba(99,102,241,0.22)',
    light:  'rgba(251,191,36,0.22)',
    system: 'rgba(148,163,184,0.22)',
  }
  const borderMap: Record<ThemeMode, string> = {
    dark:   '1px solid rgba(99,102,241,0.3)',
    light:  '1px solid rgba(251,191,36,0.3)',
    system: '1px solid rgba(148,163,184,0.3)',
  }
  const colorMap: Record<ThemeMode, string> = {
    dark:   '#818cf8',
    light:  '#fbbf24',
    system: 'var(--avp-text-dim)',
  }

  return (
    <button
      onClick={toggle}
      title={`Modo ${label} — clique para alternar`}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 8,
        width: '100%',
        background: bgMap[mode],
        border: borderMap[mode],
        color: colorMap[mode],
        cursor: 'pointer',
        padding: collapsed ? '10px 0' : '8px 12px',
        borderRadius: 8, fontSize: 13, fontWeight: 600,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHoverMap[mode] }}
      onMouseLeave={e => { e.currentTarget.style.background = bgMap[mode] }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
