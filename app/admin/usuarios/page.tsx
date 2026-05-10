import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import UsuariosCliente from './UsuariosCliente'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const [{ data: consultores }, { data: gestores }] = await Promise.all([
    (adminClient.from('alunos') as any)
      .select('id, nome, whatsapp, email, status, created_at, gestor_nome, gestor_whatsapp, user_id')
      .order('created_at', { ascending: false }),
    (adminClient.from('gestores') as any)
      .select('id, nome, email, whatsapp, ativo, created_at, user_id')
      .order('created_at', { ascending: false }),
  ])

  return (
    <AdminLayout>
      <UsuariosCliente
        consultoresIniciais={consultores ?? []}
        gestoresIniciais={gestores ?? []}
      />
    </AdminLayout>
  )
}
