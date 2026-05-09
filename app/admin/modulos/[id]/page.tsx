import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../../AdminLayout'
import ModuloEditorCliente from './ModuloEditorCliente'

export default async function ModuloDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: modulo } = await (adminClient.from('modulos') as any).select('*').eq('id', params.id).single()
  if (!modulo) redirect('/admin/modulos')

  const { data: aulas } = await (adminClient.from('aulas') as any).select('*').eq('modulo_id', params.id).order('ordem')

  return (
    <AdminLayout>
      <ModuloEditorCliente modulo={modulo} aulas={aulas ?? []} />
    </AdminLayout>
  )
}
