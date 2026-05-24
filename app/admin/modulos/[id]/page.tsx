import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../../AdminLayout'
import ModuloEditorCliente from './ModuloEditorCliente'

export default async function ModuloDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const { data: modulo } = await adminClient.from('modulos').select('*').eq('id', params.id).single()
  if (!modulo) redirect('/admin/modulos')

  const { data: aulas } = await adminClient.from('aulas').select('*').eq('modulo_id', params.id).order('ordem')

  return (
    <AdminLayout>
      <Suspense>
        <ModuloEditorCliente modulo={modulo} aulas={aulas ?? []} />
      </Suspense>
    </AdminLayout>
  )
}
