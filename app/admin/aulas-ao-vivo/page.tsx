export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import AulasAoVivoAdmin from './AulasAoVivoAdmin'

export default async function AulasAoVivoPage() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')

 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')

 const { data: aulas } = await adminClient.from('aulas_ao_vivo').select('*').is('gestor_id', null).order('data_hora')

 return (
 <AdminLayout>
 <div style={{ marginBottom: 28 }}>
 <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Aulas ao Vivo</h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
 Agende transmissões via Zoom ou Google Meet — lembrete automático 1h antes para todos os consultores
 </p>
 </div>
 <AulasAoVivoAdmin inicial={aulas ?? []} />
 </AdminLayout>
 )
}
