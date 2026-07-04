export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ModulosCliente from './ModulosCliente'

export default async function ModulosPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')
 const tid = adminRecord.tenant_id as string | null
 const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

 // Inclui modulos do proprio tenant E modulos globais (tenant_id null, criados por super admin)
 let modulosQ = adminClient.from('modulos').select('id, titulo, descricao, ordem, publicado, perfis_permitidos')
 if (tid) modulosQ = (modulosQ as any).or(`tenant_id.eq.${tid},tenant_id.is.null`)
 const { data: modulos } = await (modulosQ as any).order('ordem')

 const { data: capaCfg } = await tq(adminClient.from('configuracoes').select('valor').eq('chave', 'modulo_capa_padrao')).maybeSingle()
 const capaDefault = capaCfg?.valor ? String(capaCfg.valor).replace(/"/g, '') : null

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Módulos</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie os módulos e aulas da trilha</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 6, fontFamily: 'monospace' }}>
   Tenant ID desta conta: <strong>{tid ?? '(global — super admin)'}</strong> · {modulos?.length ?? 0} módulo(s) visível(is)
 </p>
 </div>
 <ModulosCliente modulosIniciais={modulos ?? []} capaDefault={capaDefault} />
 </AdminLayout>
 )
}
