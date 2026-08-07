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
      <main className="flex-1 min-w-0 md:ml-64" style={{ padding: 'clamp(72px, 5vw, 32px) clamp(14px, 3vw, 32px) 40px' }}>
        {children}
      </main>
    </div>
  )
}
