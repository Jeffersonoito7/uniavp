import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import BibliotecaAdminCliente from './BibliotecaAdminCliente'

export default async function BibliotecaAdminPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const admin = createServiceRoleClient()
 const { data: adminRecord } = await admin.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')
 const { data: items } = await admin.from('biblioteca')
 .select('*').eq('tenant_id', adminRecord.tenant_id ?? '').order('ordem').order('created_at', { ascending: false })
 return (
 <AdminLayout>
 <div style={{ marginBottom: 28 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800 }}>Biblioteca do Poder</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie audiobooks, podcasts e vídeos disponíveis para os consultores</p>
 </div>
 <BibliotecaAdminCliente inicial={items ?? []} />
 </AdminLayout>
 )
}
