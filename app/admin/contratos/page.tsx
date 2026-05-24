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

  const [{ data: contratos, count }, { data: formados }] = await Promise.all([
    adminClient.from('contratos')
      .select('id, nome, cpf, whatsapp, email, cnpj_mei, sede_mei, numero_registro, assinado_em, hash_contrato, pdf_url, pdf_status', { count: 'exact' })
      .order('assinado_em', { ascending: false }),
    adminClient.from('alunos')
      .select('whatsapp')
      .eq('status', 'concluido'),
  ])

  // Conta formados que ainda não assinaram
  const wppAssinados = new Set((contratos ?? []).map((c: any) => c.whatsapp))
  const formadosSemContrato = (formados ?? []).filter((a: any) => !wppAssinados.has(a.whatsapp.replace(/\D/g, ''))).length

  return (
    <AdminLayout>
      <ContratosCliente
        contratosIniciais={contratos ?? []}
        total={count ?? 0}
        formadosSemContrato={formadosSemContrato}
      />
    </AdminLayout>
  )
}
