import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { DOMINIO_MASTER } from '@/lib/constants'

export default async function HomePage() {
  const headersList = headers()
  const host = headersList.get('host')?.replace(/:\d+$/, '') ?? ''
  const isMaster = host === DOMINIO_MASTER

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(isMaster ? '/super/login' : '/login')

  const adminClient = createServiceRoleClient()

  // Se for o domínio master, verificar super admin
  if (isMaster) {
    const { data: sa } = await adminClient.from('super_admins')
      .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    if (sa) redirect('/super')
    redirect('/super/login')
  }

  // Domínio cliente — redirecionar pelo perfil
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (adminRecord) redirect('/admin')

  const { data: gestor } = await adminClient.from('gestores')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (gestor) redirect('/pro')

  const { data: aluno } = await adminClient.from('alunos')
    .select('whatsapp').eq('user_id', user.id).maybeSingle()
  if (aluno?.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

  redirect('/entrar?p=free')
}
