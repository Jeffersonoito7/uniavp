import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import GestoresCliente from './GestoresCliente'

export default async function GestoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: gestores } = await (adminClient.from('gestores') as any)
    .select('id, nome, email, whatsapp, ativo, created_at')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>✨ UNIAVP PRO</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerenciamento de contas PRO</p>
      </div>
      <GestoresCliente gestoresIniciais={gestores ?? []} />
    </AdminLayout>
  )
}
