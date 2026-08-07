import { headers } from 'next/headers'
import { getSiteConfig } from '@/lib/site-config'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host') ?? ''
  const config = await getSiteConfig(host)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <AdminSidebar logoUrl={config.logoMenuUrl} siteNome={config.nome} />

      {/* Conteúdo principal */}
      <main style={{ flex: 1, minWidth: 0, marginLeft: 248, padding: '28px 28px 40px' }}
        className="admin-main">
        <style>{`@media (max-width: 767px) { .admin-main { margin-left: 0 !important; padding: 64px 14px 40px !important; } }`}</style>
        {children}
      </main>
    </div>
  )
}
