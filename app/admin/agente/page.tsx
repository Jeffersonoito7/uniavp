import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import AdminLayout from '../AdminLayout'
import AgenteAdminCliente from './AgenteAdminCliente'

export const dynamic = 'force-dynamic'

export default async function AgenteAdminPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const ctx = await getAdminContext(user.id, adminClient)
 if (!ctx) redirect('/entrar?p=adm')

 const tenantId = ctx.tenantId ?? null

 const [configRes, argumentosRes, pacotesRes] = await Promise.all([
 (() => {
 let q = adminClient.from('agente_config').select('*')
 if (tenantId) q = q.eq('tenant_id', tenantId)
 else q = q.is('tenant_id', null)
 return q.maybeSingle()
 })(),
 (() => {
 let q = adminClient.from('agente_argumentos').select('id, categoria, argumento, ordem, ativo').order('ordem')
 if (tenantId) q = q.eq('tenant_id', tenantId)
 else q = q.is('tenant_id', null)
 return q
 })(),
 (() => {
 let q = adminClient.from('agente_pacotes').select('id, nome, creditos, valor, ordem, ativo').order('ordem')
 if (tenantId) q = q.eq('tenant_id', tenantId)
 else q = q.is('tenant_id', null)
 return q
 })(),
 ])

 return (
 <AdminLayout>
 <AgenteAdminCliente
 configInicial={configRes.data}
 argumentosIniciais={argumentosRes.data ?? []}
 pacotesIniciais={pacotesRes.data ?? []}
 />
 </AdminLayout>
 )
}
