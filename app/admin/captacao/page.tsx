import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import AdminLayout from '../AdminLayout'
import CaptacaoCliente from './CaptacaoCliente'

export const dynamic = 'force-dynamic'

export default async function CaptacaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: gestores } = await (adminClient.from('gestores') as any)
    .select('id, nome, whatsapp').eq('ativo', true).order('nome')

  const siteConfig = await getSiteConfig()
  const baseUrl = siteConfig.dominioCustomizado
    ? `https://${siteConfig.dominioCustomizado}`
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://uniavp.autovaleprevencoes.org.br')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>🔗 Links de Captação</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Compartilhe os links abaixo para captar novos consultores e gestores.
        </p>
      </div>
      <CaptacaoCliente gestores={gestores ?? []} baseUrl={baseUrl} />
    </AdminLayout>
  )
}
