'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Cog, Gift, UserCog, BarChart3, Calendar, Palette, Newspaper,
  Star, Menu, X, ChevronLeft, ChevronRight, Link2, FileText, ScrollText,
  Video, Activity, MessageSquare, Library, UserPlus, HelpCircle,
  ChevronDown, GraduationCap,
} from 'lucide-react'
import LogoutButton from '@/app/components/LogoutButton'
import SupportChat from '@/app/components/SupportChat'
import ThemeToggle from '@/app/components/ThemeToggle'

// ── Paleta ──────────────────────────────────────────────────────────
const ACCENT    = '#6366f1'
const ACCENT_BG = 'rgba(99,102,241,0.14)'
const ACCENT_TXT = '#c7d2fe'

// ── Estrutura de navegacao ───────────────────────────────────────────
type NavLeaf = { kind: 'leaf'; href: string; label: string; icon: React.ElementType }
type NavSub  = { kind: 'sub';  id: string;  label: string; icon: React.ElementType; children: NavLeaf[] }
type NavGroup = { title: string; items: (NavLeaf | NavSub)[] }

const nav: NavGroup[] = [
  {
    title: 'Dashboard',
    items: [
      { kind: 'leaf', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestao',
    items: [
      {
        kind: 'sub', id: 'alunos', label: 'Alunos', icon: GraduationCap,
        children: [
          { kind: 'leaf', href: '/admin/consultores', label: 'Free', icon: Users },
          { kind: 'leaf', href: '/admin/gestores',    label: 'Pro',  icon: UserCog },
        ],
      },
      { kind: 'leaf', href: '/admin/vincular-alunos', label: 'Vincular Alunos', icon: UserPlus },
      { kind: 'leaf', href: '/admin/admins',          label: 'Gerentes',        icon: ShieldCheck },
      { kind: 'leaf', href: '/admin/crm',             label: 'CRM',             icon: BarChart3 },
    ],
  },
  {
    title: 'Conteudo',
    items: [
      { kind: 'leaf', href: '/admin/modulos',      label: 'Modulos',    icon: BookOpen },
      { kind: 'leaf', href: '/admin/eventos',      label: 'Eventos',    icon: Calendar },
      { kind: 'leaf', href: '/admin/aulas-ao-vivo',label: 'Ao Vivo',   icon: Video },
      { kind: 'leaf', href: '/admin/biblioteca',   label: 'Biblioteca', icon: Library },
      { kind: 'leaf', href: '/admin/noticias',     label: 'Noticias',   icon: Newspaper },
      { kind: 'leaf', href: '/admin/artes',        label: 'Artes',      icon: Palette },
      { kind: 'leaf', href: '/admin/documentos',   label: 'Documentos', icon: FileText },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { kind: 'leaf', href: '/admin/captacao',   label: 'Links de Captacao', icon: Link2 },
      { kind: 'leaf', href: '/admin/contratos',  label: 'Contratos',         icon: ScrollText },
    ],
  },
  {
    title: 'Engajamento',
    items: [
      { kind: 'leaf', href: '/admin/ranking',   label: 'Ranking',   icon: Trophy },
      { kind: 'leaf', href: '/admin/premios',   label: 'Premios',   icon: Gift },
      { kind: 'leaf', href: '/admin/reacoes',   label: 'Reacoes',   icon: Star },
      { kind: 'leaf', href: '/admin/mensagens', label: 'Mensagens', icon: MessageSquare },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { kind: 'leaf', href: '/admin/configuracoes', label: 'Configuracoes', icon: Cog },
      { kind: 'leaf', href: '/admin/audit',         label: 'Audit Log',    icon: Activity },
    ],
  },
]

// Rotas filhas do submenu Alunos
const ALUNOS_PATHS = ['/admin/consultores', '/admin/gestores']

// ── CSS global da sidebar ────────────────────────────────────────────
const CSS = `
  .sb-link {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:8px;
    font-size:13.5px; font-weight:500;
    color:var(--avp-text-dim);
    text-decoration:none;
    white-space:nowrap; overflow:hidden;
    cursor:pointer; border:none; background:transparent; width:100%;
    transition:background .15s,color .15s;
    position:relative;
  }
  .sb-link:hover { background:rgba(99,102,241,.12); color:${ACCENT_TXT}; }
  .sb-link:focus-visible { outline:2px solid ${ACCENT}; outline-offset:2px; }
  .sb-link.active {
    background:${ACCENT_BG};
    color:${ACCENT_TXT};
    font-weight:600;
  }
  .sb-link.active::before {
    content:''; position:absolute;
    left:0; top:20%; bottom:20%;
    width:3px; border-radius:0 3px 3px 0;
    background:${ACCENT};
  }
  /* collapsed — centraliza icone */
  .sb-link.collapsed { justify-content:center; padding:10px 0; gap:0; }
  /* subitem */
  .sb-sub-item {
    display:flex; align-items:center; gap:9px;
    padding:7px 12px 7px 36px; border-radius:7px;
    font-size:13px; font-weight:500;
    color:var(--avp-text-dim);
    text-decoration:none;
    white-space:nowrap; overflow:hidden;
    transition:background .15s,color .15s;
  }
  .sb-sub-item:hover { background:rgba(99,102,241,.1); color:${ACCENT_TXT}; }
  .sb-sub-item:focus-visible { outline:2px solid ${ACCENT}; outline-offset:2px; }
  .sb-sub-item.active { color:${ACCENT_TXT}; font-weight:700; }
  /* submenu animation */
  .sb-sub-wrap {
    overflow:hidden;
    transition:max-height .22s cubic-bezier(.4,0,.2,1), opacity .18s ease;
  }
  /* category title */
  .sb-cat {
    font-size:10px; font-weight:700;
    text-transform:uppercase; letter-spacing:.08em;
    color:var(--avp-text-dim); opacity:.55;
    padding:14px 12px 4px;
    white-space:nowrap; overflow:hidden;
  }
  .sb-cat.collapsed { opacity:0; height:0; padding:0; margin:0; }
  /* tooltip */
  .sb-tooltip {
    position:fixed; z-index:9999;
    background:#1e1e2e; color:#f1f5f9;
    font-size:12px; font-weight:600;
    padding:5px 10px; border-radius:6px;
    pointer-events:none; white-space:nowrap;
    border:1px solid rgba(255,255,255,.1);
    box-shadow:0 4px 12px rgba(0,0,0,.4);
    opacity:0; transition:opacity .12s;
  }
  .sb-tooltip.visible { opacity:1; }
  /* quick access */
  .sb-qa {
    display:flex; align-items:center; gap:8px;
    padding:7px 12px; border-radius:7px;
    font-size:12px; font-weight:700;
    text-decoration:none;
    transition:background .15s,color .15s;
  }
  .sb-qa:hover { background:rgba(255,255,255,.07); }
  .sb-qa:focus-visible { outline:2px solid ${ACCENT}; outline-offset:2px; }
  @media(max-width:767px) {
    .sb-tooltip { display:none!important; }
  }
`

// ── Tooltip helper ───────────────────────────────────────────────────
function useTooltip() {
  const ref = useRef<HTMLDivElement>(null)

  function show(e: React.MouseEvent, label: string) {
    const el = ref.current
    if (!el) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    el.textContent = label
    el.style.top  = `${r.top + r.height / 2 - 14}px`
    el.style.left = `${r.right + 10}px`
    el.classList.add('visible')
  }

  function hide() {
    ref.current?.classList.remove('visible')
  }

  return { ref, show, hide }
}

// ── Componente principal ─────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const [siteNome,        setSiteNome]       = useState('')
  const [siteLogoUrl,    setSiteLogoUrl]     = useState('')
  const [isDominioMaster, setIsDominioMaster] = useState(false)
  const [logoError,       setLogoError]      = useState(false)
  const [isMobile,        setIsMobile]       = useState<boolean | null>(null)
  const [menuAberto,      setMenuAberto]     = useState(false)
  const [colapsada,       setColapsada]      = useState(false)

  // Submenu: quais IDs estao abertos
  const alunosActive = ALUNOS_PATHS.some(p => pathname.startsWith(p))
  const [openSubs, setOpenSubs] = useState<Set<string>>(() =>
    new Set(alunosActive ? ['alunos'] : [])
  )

  const tooltip = useTooltip()

  // Expande submenu automaticamente quando a rota e filha
  useEffect(() => {
    if (alunosActive) setOpenSubs(s => new Set([...s, 'alunos']))
  }, [pathname])

  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(d => {
      setSiteNome(d.nome)
      setSiteLogoUrl(d.logoMenuUrl || d.logoUrl || '')
      setIsDominioMaster(d.isDominioMaster)
      setLogoError(false)
    }).catch(() => {})
  }, [])

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

  function toggleSub(id: string) {
    setOpenSubs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function close() { if (isMobile) setMenuAberto(false) }

  const sidebarW = colapsada ? 58 : 248

  // ── Logo ──
  function Logo({ small = false }: { small?: boolean }) {
    return (
      <button onClick={() => window.location.reload()} title="Recarregar painel"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
        {siteLogoUrl && !isDominioMaster && !logoError ? (
          <img src={siteLogoUrl} alt={siteNome}
            style={{ maxHeight: small ? 34 : 48, maxWidth: small ? 130 : 168, objectFit: 'contain', display: 'block' }}
            onError={() => setLogoError(true)} />
        ) : (
          <span style={{ fontWeight: 700, fontSize: small ? 15 : 14, color: 'var(--avp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
            {siteNome || 'Admin'}
          </span>
        )}
      </button>
    )
  }

  // ── Item simples ──
  function Leaf({ item }: { item: NavLeaf }) {
    const active = item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href)
    const Icon = item.icon

    if (colapsada) {
      return (
        <Link href={item.href}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          className={`sb-link collapsed${active ? ' active' : ''}`}
          onClick={close}
          onMouseEnter={e => tooltip.show(e, item.label)}
          onMouseLeave={tooltip.hide}
        >
          <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        </Link>
      )
    }

    return (
      <Link href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`sb-link${active ? ' active' : ''}`}
        onClick={close}
      >
        <Icon size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
      </Link>
    )
  }

  // ── Submenu ──
  function Sub({ item }: { item: NavSub }) {
    const Icon = item.icon
    const open = openSubs.has(item.id)
    const anyActive = item.children.some(c => pathname.startsWith(c.href))

    if (colapsada) {
      // collapsed: mostra filhos diretamente como icones com tooltip
      return (
        <>
          {item.children.map(child => (
            <Leaf key={child.href} item={child} />
          ))}
        </>
      )
    }

    return (
      <div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`sub-${item.id}`}
          onClick={() => toggleSub(item.id)}
          className={`sb-link${anyActive && !open ? ' active' : ''}`}
          style={{ justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <Icon size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
          </span>
          <ChevronDown size={14} strokeWidth={2.5}
            style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        <div
          id={`sub-${item.id}`}
          className="sb-sub-wrap"
          style={{ maxHeight: open ? `${item.children.length * 44}px` : '0px', opacity: open ? 1 : 0 }}
        >
          <div style={{ paddingTop: 2, paddingBottom: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {item.children.map(child => {
              const active = pathname.startsWith(child.href)
              const CIcon = child.icon
              return (
                <Link key={child.href} href={child.href}
                  aria-current={active ? 'page' : undefined}
                  className={`sb-sub-item${active ? ' active' : ''}`}
                  onClick={close}
                >
                  <CIcon size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ──
  const sidebarContent = (
    <>
      {/* Header */}
      <div style={{
        padding: colapsada ? '0 10px 16px' : '0 14px 16px',
        borderBottom: '1px solid var(--avp-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: colapsada ? 'center' : 'space-between',
        gap: 8, minHeight: 58, flexShrink: 0,
      }}>
        {!colapsada && (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Logo />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <ThemeToggle inline />
          {!isMobile && (
            <button
              onClick={() => setColapsada(c => !c)}
              title={colapsada ? 'Expandir menu' : 'Recolher menu'}
              aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
              style={{ background: 'var(--avp-border)', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, flexShrink: 0 }}>
              {colapsada ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMenuAberto(false)} aria-label="Fechar menu"
              style={{ background: 'var(--avp-border)', border: 'none', cursor: 'pointer', color: 'var(--avp-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6 }}>
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Menu principal"
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: colapsada ? '8px 6px' : '8px 8px',
          scrollbarWidth: 'thin',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {nav.map(group => (
          <div key={group.title} role="group" aria-label={group.title}>
            {/* Categoria */}
            <div className={`sb-cat${colapsada ? ' collapsed' : ''}`}>
              {group.title}
            </div>
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
              {group.items.map(item =>
                item.kind === 'leaf'
                  ? <Leaf key={item.href} item={item} />
                  : <Sub key={item.id} item={item} />
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Acesso rapido */}
      <div style={{
        padding: colapsada ? '10px 6px' : '10px 10px',
        borderTop: '1px solid var(--avp-border)',
        display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
      }}>
        {!colapsada && (
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--avp-text-dim)', opacity: .55, padding: '0 4px', marginBottom: 4 }}>
            Visualizar como
          </p>
        )}
        {[
          { href: '/admin/ver-pro',  label: 'Painel PRO',  color: '#4ade80' },
          { href: '/admin/ver-free', label: 'Painel FREE', color: '#60a5fa' },
        ].map(qa => (
          <Link key={qa.href} href={qa.href}
            className="sb-qa"
            style={{
              color: qa.color,
              justifyContent: colapsada ? 'center' : 'flex-start',
              padding: colapsada ? '9px 0' : '7px 10px',
              gap: colapsada ? 0 : 8,
            }}
            onMouseEnter={e => colapsada && tooltip.show(e, qa.label)}
            onMouseLeave={tooltip.hide}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {qa.href.includes('pro')
                ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
                : <><path d="M2 20h.01M7 20v-4"/><path d="M12 20V10"/><path d="M17 20V4"/><path d="M22 20h.01"/></>
              }
            </svg>
            {!colapsada && <span>{qa.label}</span>}
          </Link>
        ))}
        <a href="/manual.html" target="_blank" rel="noreferrer"
          className="sb-qa"
          style={{ color: 'var(--avp-text-dim)', justifyContent: colapsada ? 'center' : 'flex-start', padding: colapsada ? '9px 0' : '7px 10px', gap: colapsada ? 0 : 8 }}
          onMouseEnter={e => colapsada && tooltip.show(e, 'Manual da Plataforma')}
          onMouseLeave={tooltip.hide}
        >
          <HelpCircle size={14} strokeWidth={1.8} />
          {!colapsada && <span>Manual da Plataforma</span>}
        </a>
      </div>

      {/* Rodape logout */}
      <div style={{
        padding: colapsada ? '12px 6px' : '12px 12px',
        borderTop: '1px solid var(--avp-border)', flexShrink: 0,
      }}>
        <LogoutButton />
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <style>{CSS}</style>

      {/* Tooltip global */}
      <div ref={tooltip.ref} className="sb-tooltip" role="tooltip" aria-hidden="true" />

      {/* Barra superior mobile */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 400, background: 'var(--avp-sidebar)', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button
            onClick={() => setMenuAberto(m => !m)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ flex: 1 }}>
            <Logo small />
          </div>
        </div>
      )}

      {/* Overlay mobile */}
      {isMobile && menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 450, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Barra lateral"
        style={{
          background: 'var(--avp-sidebar)',
          borderRight: '1px solid var(--avp-border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          ...(isMobile ? {
            width: 264,
            position: 'fixed', top: 0, left: 0, bottom: 0,
            zIndex: 500,
            transform: menuAberto ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.26s cubic-bezier(.4,0,.2,1)',
            boxShadow: menuAberto ? '6px 0 32px rgba(0,0,0,.55)' : 'none',
            paddingTop: 0,
          } : {
            transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
            width: sidebarW,
            position: 'sticky', top: 0, height: '100vh',
            flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
          }),
        }}>
        {/* Espaco para barra mobile */}
        {isMobile && <div style={{ height: 56, flexShrink: 0 }} />}
        {sidebarContent}
      </aside>

      <SupportChat painel="Admin" />

      {/* Conteudo */}
      <main style={{
        flex: 1, minWidth: 0,
        padding: isMobile ? '72px 14px 40px' : '32px',
        overflow: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}
