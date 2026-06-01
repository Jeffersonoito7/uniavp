import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ContratosCliente from './ContratosCliente'

export const dynamic = 'force-dynamic'

export default async function ContratosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const [{ data: contratos, count }, { data: todosAlunos }] = await Promise.all([
    adminClient.from('contratos')
      .select('id, nome, cpf, whatsapp, email, cnpj_mei, sede_mei, numero_registro, assinado_em, hash_contrato, pdf_url, pdf_status, clausulas_aceitas', { count: 'exact' })
      .order('assinado_em', { ascending: false }),
    adminClient.from('alunos')
      .select('id, nome, whatsapp, email, status')
      .order('nome', { ascending: true }),
  ])

  const wppAssinados = new Set((contratos ?? []).map((c: any) => c.whatsapp))
  const naoAssinaram = (todosAlunos ?? []).filter((a: any) => !wppAssinados.has(a.whatsapp.replace(/\D/g, '')))
  const formadosSemContrato = naoAssinaram.filter((a: any) => a.status === 'concluido').length

  const { data: cfgClausulas } = await adminClient.from('configuracoes')
    .select('chave').eq('chave', 'contrato_clausulas').maybeSingle()

  return (
    <AdminLayout>
      <ContratosCliente
        contratosIniciais={contratos ?? []}
        total={count ?? 0}
        formadosSemContrato={formadosSemContrato}
        naoAssinaram={naoAssinaram}
        totalAlunos={(todosAlunos ?? []).length}
        temClausulasIA={!!cfgClausulas}
      />
    </AdminLayout>
  )
}
