'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Cog, Gift, UserCog, BarChart3, Calendar, Palette, Newspaper,
  Star, Menu, X, ChevronDown, GraduationCap,
  Link2, FileText, ScrollText, Video, Activity, MessageSquare, Library,
  UserPlus, HelpCircle,
} from 'lucide-react'
import ThemeToggle from '@/app/components/ThemeToggle'
import LogoutButton from '@/app/components/LogoutButton'

// ── Estrutura de navegação ───────────────────────────────────────────
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
      { kind: 'leaf', href: '/admin/configuracoes', label: 'Configurações', icon: Cog },
      { kind: 'leaf', href: '/admin/audit',         label: 'Audit Log',    icon: Activity },
    ],
  },
]

const ALUNOS_PATHS = ['/admin/consultores', '/admin/gestores']

type Props = {
  logoUrl: string
  siteNome: string
}

export default function AdminSidebar({ logoUrl, siteNome }: Props) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const alunosAtivo = ALUNOS_PATHS.some(p => pathname.startsWith(p))
  const [openSubs, setOpenSubs] = useState<Set<string>>(
    () => new Set(alunosAtivo ? ['alunos'] : [])
  )

  // Fecha drawer ao navegar
  useEffect(() => { setAberto(false) }, [pathname])

  // Expande submenu automaticamente quando a rota é filha
  useEffect(() => {
    if (alunosAtivo) setOpenSubs(s => new Set([...s, 'alunos']))
  }, [pathname, alunosAtivo])

  // Bloqueia scroll do body quando drawer aberto
  useEffect(() => {
    if (aberto) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
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

  function LeafItem({ item }: { item: NavLeaf }) {
    const ativo = isAtivo(item.href)
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        aria-current={ativo ? 'page' : undefined}
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
          ativo
            ? 'bg-white/15 text-white'
            : 'text-white/65 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <Icon size={17} strokeWidth={1.8} className="flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
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
          className={[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
            algumAtivo && !open
              ? 'bg-white/15 text-white'
              : 'text-white/65 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          <Icon size={17} strokeWidth={1.8} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className="flex-shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {open && (
          <div className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-4">
            {item.children.map(child => {
              const ativo = pathname.startsWith(child.href)
              const CIcon = child.icon
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={ativo ? 'page' : undefined}
                  className={[
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition',
                    ativo
                      ? 'text-white font-semibold'
                      : 'text-white/55 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <CIcon size={14} strokeWidth={2} className="flex-shrink-0" />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#0f1729' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-2 min-h-[64px]">
        <div className="flex-1 min-w-0">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={siteNome}
              style={{ height: 48, objectFit: 'contain' }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="font-bold text-white text-sm truncate block">
              {siteNome || 'Admin'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle inline />
          <button
            onClick={() => setAberto(false)}
            className="md:hidden text-white/40 hover:text-white transition p-1"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Menu principal" className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {nav.map(group => (
          <div key={group.title} role="group" aria-label={group.title}>
            <div className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item =>
                item.kind === 'leaf'
                  ? <LeafItem key={item.href} item={item} />
                  : <SubItem key={item.id} item={item} />
              )}
            </div>
          </div>
        ))}

        {/* Acesso rápido */}
        <div role="group" aria-label="Visualizar como">
          <div className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
            Visualizar como
          </div>
          <div className="space-y-0.5">
            {[
              { href: '/admin/ver-pro',  label: 'Painel PRO',  color: '#4ade80' },
              { href: '/admin/ver-free', label: 'Painel FREE', color: '#60a5fa' },
            ].map(qa => (
              <Link
                key={qa.href}
                href={qa.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition hover:bg-white/10"
                style={{ color: qa.color }}
              >
                <span>{qa.label}</span>
              </Link>
            ))}
            <a
              href="/manual.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-white/50 hover:bg-white/10 hover:text-white"
            >
              <HelpCircle size={16} strokeWidth={1.8} className="flex-shrink-0" />
              <span>Manual da Plataforma</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
        <LogoutButton
          style={{
            width: '100%',
            textAlign: 'center',
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)',
          }}
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Hamburger mobile */}
      <button
        onClick={() => setAberto(true)}
        className="md:hidden fixed top-3 left-3 z-50 text-white p-2 rounded-xl shadow-lg"
        style={{ background: '#0f1729' }}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex w-64 flex-col fixed h-full z-40"
        style={{ background: '#0f1729' }}
      >
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300',
          aberto ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: '#0f1729' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
