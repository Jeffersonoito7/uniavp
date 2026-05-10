import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import PerfilCliente from './PerfilCliente'

export default async function PerfilPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/consultor/login')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, foto_url, bio, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/consultor/login')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/perfil`)

  return <PerfilCliente aluno={aluno} email={user.email ?? ''} />
}
