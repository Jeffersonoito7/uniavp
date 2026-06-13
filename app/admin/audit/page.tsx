import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import AuditLogCliente from './AuditLogCliente'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Audit Log</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Histórico de ações na plataforma</p>
 </div>
 <AuditLogCliente />
 </AdminLayout>
 )
}
