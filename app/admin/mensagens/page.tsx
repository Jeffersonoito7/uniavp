import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { MENSAGENS_PADRAO } from '@/lib/mensagem'
import AdminLayout from '../AdminLayout'
import MensagensCliente from './MensagensCliente'

export const dynamic = 'force-dynamic'

export default async function MensagensPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 const tid = adminRecord.tenant_id as string | null

 let q = adminClient.from('mensagens_template').select('chave, texto')
 if (tid) q = q.eq('tenant_id', tid)
 else q = q.is('tenant_id', null)
 const { data: customizadas } = await q

 const customMap = new Map((customizadas ?? []).map(r => [r.chave, r.texto]))

 const iniciais = Object.keys(MENSAGENS_PADRAO).map(chave => ({
 chave,
 texto: customMap.get(chave) ?? MENSAGENS_PADRAO[chave],
 customizado: customMap.has(chave),
 }))

 return (
 <AdminLayout>
 <div style={{ marginBottom: 24 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Mensagens WhatsApp</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
 Personalize os textos enviados automaticamente pela plataforma.
 </p>
 </div>
 <MensagensCliente iniciais={iniciais} />
 </AdminLayout>
 )
}
