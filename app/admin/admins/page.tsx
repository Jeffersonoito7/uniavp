import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import AdminsCliente from './AdminsCliente'

export default async function AdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: admins } = await (adminClient.from('admins') as any)
    .select('id, nome, email, role, ativo, created_at, user_id').order('created_at')

  return (
    <AdminLayout>
      <AdminsCliente adminsIniciais={admins ?? []} meuUserId={user.id} />
    </AdminLayout>
  )
}
