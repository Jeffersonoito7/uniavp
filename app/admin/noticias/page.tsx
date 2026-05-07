import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import NoticiasCliente from './NoticiasCliente'

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')
  const { data: noticias } = await (adminClient.from('noticias') as any).select('*').order('created_at', { ascending: false })
  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Mural de Notícias</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Publique avisos e novidades visíveis para todos os consultores</p>
      </div>
      <NoticiasCliente inicial={noticias ?? []} />
    </AdminLayout>
  )
}
