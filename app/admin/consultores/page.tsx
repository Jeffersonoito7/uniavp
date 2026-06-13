import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ConsultoresCliente from './ConsultoresCliente'

export default async function ConsultoresPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')
 const tid = adminRecord.tenant_id as string | null

 let q = adminClient.from('alunos')
 .select('id, nome, whatsapp, email, status, created_at, user_id, indicador:indicadores(nome)')
 .order('created_at', { ascending: false })
 if (tid) q = q.eq('tenant_id', tid)
 const { data: consultores } = await q

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>UNIAVP FREE</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie os consultores cadastrados</p>
 </div>
 <ConsultoresCliente consultoresIniciais={consultores ?? []} />
 </AdminLayout>
 )
}
