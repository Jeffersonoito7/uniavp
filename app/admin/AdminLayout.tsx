'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Cog, Gift, UserCog, BarChart3, Calendar, Palette, Newspaper, Star,
  Menu, X, ChevronLeft, ChevronRight, Link2, IdCard, FileText, ScrollText, Video, Activity, MessageSquare, Bot, HelpCircle, Library
} from 'lucide-react'
import LogoutButton from '@/app/components/LogoutButton'
import SupportChat from '@/app/components/SupportChat'
import ThemeToggle from '@/app/components/ThemeToggle'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Cog },
  { href: '/admin/consultores', label: 'FREE', icon: Users },
  { href: '/admin/gestores', label: 'PRO', icon: UserCog },
  { href: '/admin/admins', label: 'Gerentes', icon: ShieldCheck },
  { href: '/admin/crm', label: 'CRM', icon: BarChart3 },
  { href: '/admin/modulos', label: 'Módulos', icon: BookOpen },
  { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
  { href: '/admin/aulas-ao-vivo', label: 'Ao Vivo', icon: Video },
  { href: '/admin/noticias', label: 'Notícias', icon: Newspaper },
  { href: '/admin/captacao', label: 'Links de Captação', icon: Link2 },
  { href: '/admin/cncpv', label: 'CNCPV', icon: IdCard },
  { href: '/admin/contratos', label: 'Contratos', icon: ScrollText },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/premios', label: 'Prêmios', icon: Gift },
  { href: '/admin/artes', label: 'Artes', icon: Palette },
  { href: '/admin/reacoes', label: 'Reações', icon: Star },
  { href: '/admin/mensagens', label: 'Mensagens', icon: MessageSquare },
  { href: '/admin/audit', label: 'Audit Log', icon: Activity },
  { href: '/admin/agente', label: 'Agente IA', icon: Bot },
  { href: '/admin/biblioteca', label: 'Biblioteca', icon: Library },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [siteNome, setSiteNome] = useState('')
  const [siteLogoUrl, setSiteLogoUrl] = useState('')
  const [isDominioMaster, setIsDominioMaster] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setSiteNome(d.nome)
      setSiteLogoUrl(d.logoMenuUrl || d.logoUrl || '')
      setIsDominioMaster(d.isDominioMaster)
      setLogoError(false)
    }).catch(() => {})
  }, [])

  // Atualiza logo instantaneamente quando o upload acontece na tela de Configurações
  useEffect(() => {
    function onLogoUpdated(e: CustomEvent) {
      const { chave, url } = e.detail
      if (chave === 'logo_menu_url' || chave === 'site_logo_url') {
        setSiteLogoUrl(url || '')
        setLogoError(false)
      }
    }
    window.addEventListener('site-logo-updated', onLogoUpdated as EventListener)
    return () => window.removeEventListener('site-logo-updated', onLogoUpdated as EventListener)
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

  const logoMarkup = (small = false) => (
    <button onClick={() => window.location.reload()}
      title="Recarregar painel"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
      {siteLogoUrl && !isDominioMaster && !logoError ? (
        <img src={siteLogoUrl} alt={siteNome} className="logo-site"
          style={{ maxHeight: small ? 36 : 52, maxWidth: small ? 140 : 180, objectFit: 'contain', display: 'block' }}
          onError={() => setLogoError(true)} />
      ) : (
        <span style={{ fontWeight: 700, fontSize: small ? 16 : 15, color: 'var(--avp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          {siteNome || 'Admin'}
        </span>
      )}
    </button>
  )

  const audioCtxRef = useRef<AudioContext | null>(null)
  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }
  function playHover() {
    try {
      const ctx = getAudioCtx()
      const t = ctx.currentTime

      // ── Clique (transiente agudo, 8ms) ────────────────────────────
      const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate)
      const clickData = clickBuf.getChannelData(0)
      for (let i = 0; i < clickData.length; i++) {
        const decay = 1 - i / clickData.length
        clickData[i] = (Math.random() * 2 - 1) * decay
      }
      const clickSrc = ctx.createBufferSource()
      clickSrc.buffer = clickBuf
      const clickGain = ctx.createGain()
      clickGain.gain.setValueAtTime(0.18, t)
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008)
      clickSrc.connect(clickGain)
      clickGain.connect(ctx.destination)
      clickSrc.start(t)

      // ── Batida grave (corpo da tecla, 30ms) ───────────────────────
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(120, t)
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.03)
      oscGain.gain.setValueAtTime(0.09, t)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.03)
    } catch { /* AudioContext indisponível */ }
  }

  const sidebarW = colapsada ? 56 : 240
  const hoverCSS = `
    .adm-nav-item:hover { background: rgba(99,102,241,0.14) !important; color: #fff !important; }
    .adm-nav-item { transition: background 0.18s, color 0.18s !important; }
  `

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <style>{hoverCSS}</style>

      {/* ── Barra superior mobile ── */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 400, background: 'var(--avp-sidebar)', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button onClick={() => setMenuAberto(m => !m)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ flex: 1 }}>{logoMarkup(true)}</div>
        </div>
      )}

      {/* ── Overlay mobile ── */}
      {isMobile && menuAberto && (
        <div onClick={() => setMenuAberto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 450, backdropFilter: 'blur(2px)' }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        background: 'var(--avp-sidebar)',
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
            <ThemeToggle inline />
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
        <nav style={{ flex: 1, padding: colapsada ? '12px 8px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={active ? undefined : 'adm-nav-item'}
                onClick={() => isMobile && setMenuAberto(false)}
                onMouseEnter={() => playHover()}
                title={colapsada ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 10,
                  justifyContent: colapsada ? 'center' : 'flex-start',
                  padding: colapsada ? '10px 0' : '11px 12px',
                  borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? '#fff' : 'var(--avp-text-dim)',
                  background: active ? 'var(--avp-border)' : 'transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                {!colapsada && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* ── Acesso rápido ── */}
        <div style={{ padding: colapsada ? '10px 8px' : '10px 12px', borderTop: '1px solid var(--avp-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!colapsada && <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Visualizar como</p>}
          <Link href="/admin/ver-pro"
            title="Ver Painel PRO"
            style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 8, justifyContent: colapsada ? 'center' : 'flex-start', background: pathname.startsWith('/admin/ver-pro') ? '#4f46e5' : 'rgba(79,70,229,0.25)', border: '1px solid rgba(99,102,241,0.5)', color: '#c7d2fe', borderRadius: 7, padding: colapsada ? '9px 0' : '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s', letterSpacing: '0.01em' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01M7 20v-4"/><path d="M12 20V10"/><path d="M17 20V4"/><path d="M22 20h.01"/></svg>
            {!colapsada && <span>Painel PRO</span>}
          </Link>
          <Link href="/admin/ver-free"
            title="Ver Painel FREE"
            style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 8, justifyContent: colapsada ? 'center' : 'flex-start', background: pathname.startsWith('/admin/ver-free') ? '#16a34a' : 'rgba(22,163,74,0.25)', border: '1px solid rgba(34,197,94,0.5)', color: '#86efac', borderRadius: 7, padding: colapsada ? '9px 0' : '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s', letterSpacing: '0.01em' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {!colapsada && <span>Painel FREE</span>}
          </Link>
          <a href="/manual.html" target="_blank" rel="noreferrer" title="Manual da Plataforma"
            style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 8, justifyContent: colapsada ? 'center' : 'flex-start', background: 'rgba(217,119,6,0.25)', border: '1px solid rgba(251,191,36,0.5)', color: '#fde68a', borderRadius: 7, padding: colapsada ? '9px 0' : '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s' }}>
            <HelpCircle size={13} style={{ flexShrink: 0 }} />
            {!colapsada && <span>Manual da Plataforma</span>}
          </a>
        </div>

        {/* ── Rodapé ── */}
        <div style={{ padding: colapsada ? '12px 8px' : '12px 14px', borderTop: '1px solid var(--avp-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!colapsada && <LogoutButton style={{ flex: 1 }} />}
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
