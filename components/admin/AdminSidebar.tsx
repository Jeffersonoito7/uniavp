'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Cog, Gift, UserCog, BarChart3, Calendar, Palette, Newspaper,
  Star, Menu, X, ChevronDown, GraduationCap,
  Link2, FileText, ScrollText, Video, MessageSquare, Library,
  UserPlus, HelpCircle, Activity, ClipboardList,
} from 'lucide-react'
import ThemeToggle from '@/app/components/ThemeToggle'
import LogoutButton from '@/app/components/LogoutButton'

const BG = 'linear-gradient(180deg, #0a2240 0%, #063a2e 100%)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT_DIM = 'rgba(255,255,255,0.82)'
const TEXT_MUTED = 'rgba(255,255,255,0.45)'

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
    title: 'Gestão',
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
    title: 'Conteúdo',
    items: [
      { kind: 'leaf', href: '/admin/modulos',       label: 'Módulos',    icon: BookOpen },
      { kind: 'leaf', href: '/admin/eventos',       label: 'Eventos',    icon: Calendar },
      { kind: 'leaf', href: '/admin/aulas-ao-vivo', label: 'Ao Vivo',    icon: Video },
      { kind: 'leaf', href: '/admin/biblioteca',    label: 'Biblioteca', icon: Library },
      { kind: 'leaf', href: '/admin/noticias',      label: 'Notícias',   icon: Newspaper },
      { kind: 'leaf', href: '/admin/artes',         label: 'Artes',      icon: Palette },
      { kind: 'leaf', href: '/admin/documentos',    label: 'Documentos', icon: FileText },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { kind: 'leaf', href: '/admin/captacao',  label: 'Links de Captação', icon: Link2 },
      { kind: 'leaf', href: '/admin/contratos', label: 'Contratos',         icon: ScrollText },
    ],
  },
  {
    title: 'Engajamento',
    items: [
      { kind: 'leaf', href: '/admin/ranking',   label: 'Ranking',   icon: Trophy },
      { kind: 'leaf', href: '/admin/premios',   label: 'Prêmios',   icon: Gift },
      { kind: 'leaf', href: '/admin/reacoes',   label: 'Reações',   icon: Star },
      { kind: 'leaf', href: '/admin/mensagens', label: 'Mensagens', icon: MessageSquare },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { kind: 'leaf', href: '/admin/relatorio-conclusao', label: 'Relatório Conclusão', icon: ClipboardList },
      { kind: 'leaf', href: '/admin/configuracoes',       label: 'Configurações',        icon: Cog },
      { kind: 'leaf', href: '/admin/audit',               label: 'Audit Log',            icon: Activity },
    ],
  },
]

type Props = { logoUrl: string; siteNome: string }

export default function AdminSidebar({ logoUrl, siteNome }: Props) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const alunosAtivo = ['/admin/consultores', '/admin/gestores'].some(p => pathname.startsWith(p))
  const [openSubs, setOpenSubs] = useState<Set<string>>(
    () => new Set(alunosAtivo ? ['alunos'] : [])
  )

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setAberto(false) }, [pathname])

  useEffect(() => {
    if (alunosAtivo) setOpenSubs(s => new Set([...s, 'alunos']))
  }, [pathname, alunosAtivo])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  function toggleSub(id: string) {
    setOpenSubs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function isAtivo(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  }

  function linkStyle(ativo: boolean): React.CSSProperties {
    return {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10,
      fontSize: 13, fontWeight: ativo ? 600 : 500,
      color: ativo ? '#fff' : TEXT_DIM,
      background: ativo ? 'rgba(255,255,255,0.12)' : 'transparent',
      textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
      cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left',
    }
  }

  function LeafItem({ item }: { item: NavLeaf }) {
    const ativo = isAtivo(item.href)
    const Icon = item.icon
    return (
      <Link href={item.href} aria-current={ativo ? 'page' : undefined} style={linkStyle(ativo)}>
        <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{item.label}</span>
      </Link>
    )
  }

  function SubItem({ item }: { item: NavSub }) {
    const Icon = item.icon
    const open = openSubs.has(item.id)
    const algumAtivo = item.children.some(c => pathname.startsWith(c.href))
    return (
      <div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggleSub(item.id)}
          style={linkStyle(algumAtivo && !open)}
        >
          <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{item.label}</span>
          <ChevronDown size={13} strokeWidth={2.5} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {open && (
          <div style={{ paddingLeft: 16, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {item.children.map(child => {
              const ativo = pathname.startsWith(child.href)
              const CIcon = child.icon
              return (
                <Link key={child.href} href={child.href} aria-current={ativo ? 'page' : undefined}
                  style={{ ...linkStyle(ativo), fontSize: 12, padding: '7px 12px' }}>
                  <CIcon size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: BG }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 64, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {logoUrl && !logoError ? (
            <img src={logoUrl} alt={siteNome} style={{ height: 44, maxWidth: 160, objectFit: 'contain', display: 'block' }} onError={() => setLogoError(true)} />
          ) : (
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{siteNome || 'Admin'}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <ThemeToggle inline />
          {isMobile && (
            <button onClick={() => setAberto(false)} aria-label="Fechar menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_DIM, padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Menu principal" style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {nav.map(group => (
          <div key={group.title}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: TEXT_MUTED, padding: '0 12px', marginBottom: 6 }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item =>
                item.kind === 'leaf'
                  ? <LeafItem key={item.href} item={item} />
                  : <SubItem key={item.id} item={item} />
              )}
            </div>
          </div>
        ))}

        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: TEXT_MUTED, padding: '0 12px', marginBottom: 6 }}>
            Visualizar como
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { href: '/admin/ver-pro',  label: 'Painel PRO',  color: '#4ade80' },
              { href: '/admin/ver-free', label: 'Painel FREE', color: '#60a5fa' },
            ].map(qa => (
              <Link key={qa.href} href={qa.href}
                style={{ ...linkStyle(false), color: qa.color, fontWeight: 700 }}>
                <span>{qa.label}</span>
              </Link>
            ))}
            <a href="/manual.html" target="_blank" rel="noreferrer"
              style={{ ...linkStyle(false), color: TEXT_DIM, textDecoration: 'none' }}>
              <HelpCircle size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <span>Manual da Plataforma</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <LogoutButton style={{ width: '100%', textAlign: 'center', borderColor: BORDER, color: TEXT_DIM }} />
      </div>
    </div>
  )

  const sidebarStyle: React.CSSProperties = {
    width: 248, background: BG, display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40,
  }

  return (
    <>
      {/* Hamburger — só mobile */}
      {isMobile && (
        <button onClick={() => setAberto(true)} aria-label="Abrir menu"
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, background: BG, border: 'none', cursor: 'pointer', color: '#fff', padding: 8, borderRadius: 10, display: 'flex' }}>
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={sidebarStyle}>
          {content}
        </aside>
      )}

      {/* Overlay mobile */}
      {isMobile && aberto && (
        <div onClick={() => setAberto(false)} aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Drawer mobile */}
      {isMobile && (
        <aside style={{ ...sidebarStyle, width: 280, zIndex: 50, transform: aberto ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}>
          {content}
        </aside>
      )}
    </>
  )
}
