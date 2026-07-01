export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import PerfilCliente from './PerfilCliente'

export default async function PerfilPage({ params, searchParams }: { params: { whatsapp: string }; searchParams?: { aviso?: string } }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=free')

 const adminClient = createServiceRoleClient()
 const { data: aluno } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, email, cpf, foto_url, bio, status, numero_registro, data_formacao, link_externo, indicador_id, indicador:indicadores(nome, whatsapp)')
 .eq('user_id', user.id)
 .maybeSingle()

 if (!aluno) redirect('/entrar?p=free')
 if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/perfil`)

 const { data: cfg } = await adminClient.from('configuracoes')
 .select('valor').eq('chave', 'free_pode_configurar_link').maybeSingle()
 const podeCfgLink = cfg?.valor !== 'false'

 const avisoCpf = searchParams?.aviso === 'cpf'
 return <PerfilCliente aluno={aluno} email={user.email ?? ''} podeCfgLink={podeCfgLink} indicador={(aluno as { indicador?: { nome: string; whatsapp: string } | null }).indicador ?? null} avisoCpf={avisoCpf} />
}
