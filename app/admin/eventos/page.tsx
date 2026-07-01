export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import EventosCliente from './EventosCliente'

export default async function EventosPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 const { data: eventos } = await adminClient.from('eventos')
 .select('*').order('data_hora')

 return (
 <AdminLayout>
 <div style={{ marginBottom: 28 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Calendário de Eventos</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie eventos, cidades e notifique os consultores</p>
 </div>
 <EventosCliente inicial={eventos ?? []} />
 </AdminLayout>
 )
}
