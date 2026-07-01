export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import GestoresCliente from './GestoresCliente'

export default async function GestoresPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const adminClient = createServiceRoleClient()
 const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
 adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 ])
 if (!adminRecord && !superRecord) redirect('/entrar?p=adm')
 const tid = (adminRecord?.tenant_id ?? null) as string | null

 let q = (adminClient.from('gestores') as any)
 .select('id, nome, email, whatsapp, ativo, created_at, status_assinatura, plano_vencimento, trial_expira_em, cpf')
 .order('created_at', { ascending: false })
 if (tid) q = q.eq('tenant_id', tid)
 const { data: gestores } = await q

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>UNIAVP PRO</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerenciamento de contas PRO</p>
 </div>
 <GestoresCliente gestoresIniciais={gestores ?? []} />
 </AdminLayout>
 )
}
