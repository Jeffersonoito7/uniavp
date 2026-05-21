import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import DocumentosCliente from './DocumentosCliente'

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const { data: documentos } = await (adminClient.from('documentos_painel') as any)
    .select('*')
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <AdminLayout>
      <DocumentosCliente documentosIniciais={documentos ?? []} />
    </AdminLayout>
  )
}
