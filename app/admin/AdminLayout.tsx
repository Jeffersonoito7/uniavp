'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from '@/app/components/ThemeToggle';

const navItems = [
  { label: 'Dashboard', href: '/admin', key: 'dashboard' },
  { label: 'Módulos', href: '/admin/modulos', key: 'modulos' },
  { label: 'Consultores', href: '/admin/consultores', key: 'consultores' },
  { label: 'Ranking', href: '/admin/ranking', key: 'ranking' },
  { label: 'Administradores', href: '/admin/admins', key: 'admins' },
  { label: 'Configurações', href: '/admin/configuracoes', key: 'configuracoes' },
];

export default function AdminLayout({ children, paginaAtiva }: { children: React.ReactNode; paginaAtiva: string }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--avp-black)' }}>
      <nav style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--avp-card)',
        borderRight: '1px solid var(--avp-border)',
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 32px' }}>
          <p style={{ fontSize: 18, letterSpacing: 2, margin: 0, fontWeight: 800, color: '#fff' }}>
            UNIVERSIDADE AVP
          </p>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>Admin</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {navItems.map(item => {
            const ativo = paginaAtiva === item.key;
            return (
              <a
                key={item.key}
                href={item.href}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: ativo ? 600 : 400,
                  color: ativo ? 'var(--avp-text)' : 'var(--avp-text-dim)',
                  background: ativo ? 'rgba(51,54,135,0.2)' : 'transparent',
                  borderLeft: ativo ? '2px solid var(--avp-blue-bright)' : '2px solid transparent',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
      <main style={{ flex: 1, padding: '40px 5%', overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}
