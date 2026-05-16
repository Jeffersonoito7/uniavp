'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Users, Calendar, Smartphone, Menu, X, ChevronLeft, ChevronRight, LayoutDashboard, BookOpen, Palette, UserCircle } from 'lucide-react'
import SupportChat from '@/app/components/SupportChat'

const navItems = [
  { id: 'dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'consultores', label: 'Minha Equipe', icon: Users },
  { id: 'aulas',       label: 'Aulas',       icon: BookOpen },
  { id: 'eventos',     label: 'Eventos',     icon: Calendar },
  { id: 'whatsapp',    label: 'WhatsApp',    icon: Smartphone },
  { id: 'artes',       label: 'Artes',       icon: Palette },
  { id: 'perfil',      label: 'Meu Perfil',  icon: UserCircle },
]

export default function GestorLayout({
  children,
  aba,
  setAba,
  nomeGestor,
  fotoPerfilInicial,
}: {
  children: React.ReactNode
  aba: string
  setAba: (a: string) => void
  nomeGestor: string
  fotoPerfilInicial?: string | null
}) {
  const [siteNome, setSiteNome] = useState('')
  const [siteLogoUrl, setSiteLogoUrl] = useState('')
  const [fotoPerfil] = useState<string | null>(fotoPerfilInicial ?? null)
  const [logoError, setLogoError] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setSiteNome(d.nome)
      setSiteLogoUrl(d.logoUrl || '')
      setLogoError(false)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function sair() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    window.location.href = '/entrar'
  }

  function handleNav(id: string) {
    setAba(id)
    if (isMobile) setMenuAberto(false)
  }

  const logoMarkup = (small = false) => siteLogoUrl && !logoError ? (
    <img src={siteLogoUrl} alt={siteNome} className="logo-site"
      style={{ maxHeight: small ? 28 : 32, maxWidth: small ? 120 : 140, objectFit: 'contain', display: 'block' }}
      onError={() => setLogoError(true)} />
  ) : (
    <span style={{ fontWeight: 800, fontSize: small ? 16 : 15, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {siteNome || 'PRO'}
    </span>
  )

  const sidebarW = colapsada ? 56 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <SupportChat painel="PRO" />

      {/* ── Barra superior mobile ── */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 400, background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button onClick={() => setMenuAberto(m => !m)}
            style={{ background: 'none', border: 'none', color: 'var(--avp-text)', cursor: 'pointer', padding: 4 }}>
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
          {logoMarkup(true)}
        </div>
      )}

      {/* ── Overlay mobile ── */}
      {isMobile && menuAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
          onClick={() => setMenuAberto(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: isMobile ? 220 : sidebarW,
        flexShrink: 0,
        background: 'var(--avp-card)',
        borderRight: '1px solid var(--avp-border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        zIndex: 350,
        transform: isMobile ? (menuAberto ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.25s ease, width 0.2s ease',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: colapsada && !isMobile ? 'center' : 'space-between', padding: colapsada && !isMobile ? '0 12px' : '0 16px 0 20px', borderBottom: '1px solid var(--avp-border)', flexShrink: 0 }}>
          {(!colapsada || isMobile) && logoMarkup()}
          {!isMobile && (
            <button onClick={() => setColapsada(c => !c)}
              style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6, flexShrink: 0 }}>
              {colapsada ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Perfil do gestor — clicável para abrir aba Perfil */}
        {(!colapsada || isMobile) && (
          <button
            onClick={() => { setAba('perfil'); if (isMobile) setMenuAberto(false) }}
            style={{ padding: '14px 20px', borderBottom: '1px solid var(--avp-border)', flexShrink: 0, background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' as const }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: '2px solid var(--avp-border)' }}>
                {fotoPerfil
                  ? <img src={fotoPerfil} alt={nomeGestor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff' }}>{nomeGestor.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--avp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{nomeGestor}</p>
                <p style={{ fontSize: 11, color: '#818cf8', margin: 0, fontWeight: 700 }}>✨ UNIAVP PRO</p>
              </div>
            </div>
          </button>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const Icon = item.icon
            const ativo = aba === item.id
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                title={colapsada && !isMobile ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: colapsada && !isMobile ? 0 : 10,
                  padding: colapsada && !isMobile ? '10px 0' : '10px 12px',
                  justifyContent: colapsada && !isMobile ? 'center' : 'flex-start',
                  borderRadius: 8, cursor: 'pointer', border: 'none',
                  background: ativo ? 'var(--grad-brand)' : 'none',
                  color: ativo ? '#fff' : 'var(--avp-text-dim)',
                  fontWeight: ativo ? 600 : 400, fontSize: 14,
                  transition: 'all 0.15s', width: '100%',
                }}
                onMouseEnter={e => { if (!ativo) e.currentTarget.style.background = 'var(--avp-black)' }}
                onMouseLeave={e => { if (!ativo) e.currentTarget.style.background = 'none' }}
              >
                <Icon size={18} />
                {(!colapsada || isMobile) && <span>{item.label}</span>}
                {/* Badge WhatsApp desconectado */}
                {item.id === 'whatsapp' && (!colapsada || isMobile) && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: '#25d36620', color: '#25d366', borderRadius: 10, padding: '2px 6px', fontWeight: 600 }}>ZAP</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--avp-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>

          <button onClick={sair}
            style={{
              display: 'flex', alignItems: 'center', gap: colapsada && !isMobile ? 0 : 10,
              justifyContent: colapsada && !isMobile ? 'center' : 'flex-start',
              padding: colapsada && !isMobile ? '10px 0' : '10px 12px',
              borderRadius: 8, cursor: 'pointer', border: 'none',
              background: 'none', color: 'var(--avp-text-dim)', fontSize: 14, width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e6394615'; e.currentTarget.style.color = 'var(--avp-danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--avp-text-dim)' }}>
            <span style={{ fontSize: 16 }}>⎋</span>
            {(!colapsada || isMobile) && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Conteúdo ── */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarW,
        marginTop: isMobile ? 56 : 0,
        marginBottom: isMobile ? 64 : 0,
        padding: isMobile ? '16px 12px 24px' : '32px',
        transition: 'margin-left 0.2s ease',
        minWidth: 0,
      }}>
        {children}
      </main>

      {/* ── Bottom nav mobile ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 400,
          background: 'var(--avp-card)', borderTop: '1px solid var(--avp-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          height: 60, padding: '0 4px',
        }}>
          {navItems.map(item => {
            const Icon = item.icon
            const ativo = aba === item.id
            return (
              <button key={item.id} onClick={() => handleNav(item.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, background: 'none', border: 'none',
                  cursor: 'pointer', padding: '8px 4px',
                  color: ativo ? 'var(--avp-green)' : 'var(--avp-text-dim)',
                }}>
                <Icon size={20} strokeWidth={ativo ? 2.5 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: ativo ? 700 : 400, letterSpacing: 0.3 }}>
                  {item.label}
                </span>
              </button>
            )
          })}
          <button onClick={sair}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', color: 'var(--avp-text-dim)' }}>
            <span style={{ fontSize: 18 }}>⎋</span>
            <span style={{ fontSize: 10 }}>Sair</span>
          </button>
        </nav>
      )}
    </div>
  )
}
