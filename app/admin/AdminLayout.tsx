'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Users, ShieldCheck,
  Trophy, Settings, Gift, UserCog, BarChart3, Calendar, Palette
} from 'lucide-react'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/crm', label: 'CRM', icon: BarChart3 },
  { href: '/admin/modulos', label: 'Módulos', icon: BookOpen },
  { href: '/admin/consultores', label: 'Consultores', icon: Users },
  { href: '/admin/gestores', label: 'Gestores', icon: UserCog },
  { href: '/admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/premios', label: 'Prêmios', icon: Gift },
  { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
  { href: '/admin/artes', label: 'Artes', icon: Palette },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: 220, background: 'var(--avp-card)', borderRight: '1px solid var(--avp-border)', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Uni AVP
            </span>
            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 2 }}>Painel Admin</p>
          </div>
          <ThemeToggle />
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? 'var(--avp-text)' : 'var(--avp-text-dim)',
                  background: active ? 'var(--avp-border)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--avp-border)' }}>
          <EventosWidget />
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
