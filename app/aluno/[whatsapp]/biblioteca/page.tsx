import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import BibliotecaCliente from './BibliotecaCliente'

export default async function BibliotecaPage({ params }: { params: { whatsapp: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=free')

  const admin = createServiceRoleClient()
  const { data: aluno } = await admin.from('alunos')
    .select('id, nome, whatsapp, status, tenant_id')
    .eq('user_id', user.id).maybeSingle()
  if (!aluno) redirect('/entrar?p=free')
  if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}/biblioteca`)

  const { data: items } = await admin.from('biblioteca')
    .select('*').eq('tenant_id', aluno.tenant_id ?? '').eq('ativo', true)
    .order('ordem').order('created_at', { ascending: false })

  return (
    <BibliotecaCliente
      items={items ?? []}
      whatsapp={params.whatsapp}
      alunoNome={aluno.nome}
    />
  )
}
