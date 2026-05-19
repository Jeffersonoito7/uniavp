import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import PerfilCliente from './PerfilCliente'

export default async function PerfilPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=free')

  const adminClient = createServiceRoleClient()
  const { data: aluno } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, foto_url, bio, status, numero_registro, data_formacao, link_externo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/entrar?p=free')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/perfil`)

  const { data: cfg } = await (adminClient.from('configuracoes') as any)
    .select('valor').eq('chave', 'free_pode_configurar_link').maybeSingle()
  const podeCfgLink = cfg?.valor === 'true'

  return <PerfilCliente aluno={aluno} email={user.email ?? ''} podeCfgLink={podeCfgLink} />
}
