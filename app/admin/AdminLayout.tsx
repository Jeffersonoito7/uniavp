'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Settings, Gift, UserCog, BarChart3, Calendar, Palette, Newspaper, Star,
  Menu, X, ChevronLeft, ChevronRight, UsersRound
} from 'lucide-react'
import ThemeToggle from '@/app/components/ThemeToggle'
import LogoutButton from '@/app/components/LogoutButton'
import SupportChat from '@/app/components/SupportChat'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/crm', label: 'CRM', icon: BarChart3 },
  { href: '/admin/modulos', label: 'Módulos', icon: BookOpen },
  { href: '/admin/usuarios', label: 'Usuários', icon: UsersRound },
  { href: '/admin/consultores', label: 'Consultores', icon: Users },
  { href: '/admin/gestores', label: 'Gestores', icon: UserCog },
  { href: '/admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/premios', label: 'Prêmios', icon: Gift },
  { href: '/admin/noticias', label: 'Notícias', icon: Newspaper },
  { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
  { href: '/admin/artes', label: 'Artes', icon: Palette },
  { href: '/admin/reacoes', label: 'Reações', icon: Star },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [siteNome, setSiteNome] = useState('')
  const [siteLogoUrl, setSiteLogoUrl] = useState('')
  const [isDominioMaster, setIsDominioMaster] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setSiteNome(d.nome)
      setSiteLogoUrl(d.logoUrl || '')
      setIsDominioMaster(d.isDominioMaster)
      setLogoError(false)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) setMenuAberto(false)
  }, [pathname, isMobile])

  const logoMarkup = (small = false) => siteLogoUrl && !isDominioMaster && !logoError ? (
    <img src={siteLogoUrl} alt={siteNome} className="logo-site"
      style={{ maxHeight: small ? 28 : 32, maxWidth: small ? 120 : 140, objectFit: 'contain', display: 'block' }}
      onError={() => setLogoError(true)} />
  ) : (
    <span style={{ fontWeight: 800, fontSize: small ? 16 : 15, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {siteNome || 'Admin'}
    </span>
  )

  const sidebarW = colapsada ? 56 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Barra superior mobile ── */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 400, background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button onClick={() => setMenuAberto(m => !m)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ flex: 1 }}>{logoMarkup(true)}</div>
          <ThemeToggle />
        </div>
      )}

      {/* ── Overlay mobile ── */}
      {isMobile && menuAberto && (
        <div onClick={() => setMenuAberto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 450, backdropFilter: 'blur(2px)' }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        background: 'var(--avp-card)',
        borderRight: '1px solid var(--avp-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0 0',
        overflow: 'hidden',
        ...(isMobile ? {
          width: 260,
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 500,
          transform: menuAberto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          boxShadow: menuAberto ? '6px 0 32px rgba(0,0,0,0.5)' : 'none',
        } : {
          transition: 'width 0.22s ease',
          width: sidebarW,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }),
      }}>

        {/* ── Header da sidebar ── */}
        <div style={{ padding: colapsada ? '0 10px 18px' : '0 16px 18px', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: colapsada ? 'center' : 'space-between', gap: 8, minHeight: 56 }}>
          {!colapsada && (
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {logoMarkup()}
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2, whiteSpace: 'nowrap' }}>Painel Admin</p>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {/* Botão colapsar/expandir desktop */}
            {!isMobile && (
              <button
                onClick={() => setColapsada(c => !c)}
                title={colapsada ? 'Expandir menu' : 'Recolher menu'}
                style={{ background: 'var(--avp-border)', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, flexShrink: 0 }}>
                {colapsada ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            )}
            {/* Botão fechar mobile */}
            {isMobile && (
              <button onClick={() => setMenuAberto(false)}
                style={{ background: 'var(--avp-border)', border: 'none', cursor: 'pointer', color: 'var(--avp-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6 }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: colapsada ? '12px 8px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} onClick={() => isMobile && setMenuAberto(false)}
                title={colapsada ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 10,
                  justifyContent: colapsada ? 'center' : 'flex-start',
                  padding: colapsada ? '10px 0' : '11px 12px',
                  borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? 'var(--avp-text)' : 'var(--avp-text-dim)',
                  background: active ? 'var(--avp-border)' : 'transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  transition: 'background 0.15s',
                }}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!colapsada && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* ── Rodapé ── */}
        <div style={{ padding: colapsada ? '12px 8px' : '12px 14px', borderTop: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: colapsada ? 'center' : 'space-between' }}>
          {!colapsada && <LogoutButton style={{ flex: 1 }} />}
          <ThemeToggle />
          {colapsada && <LogoutButton />}
        </div>
      </aside>

      <SupportChat painel="Admin" />

      {/* ── Conteúdo principal ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: isMobile ? '68px 14px 40px' : '32px',
        overflow: 'auto',
        transition: 'padding 0.22s ease',
      }}>
        {children}
      </main>
    </div>
  )
}
