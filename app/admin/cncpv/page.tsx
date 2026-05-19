import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import CNCPVCliente from './CNCPVCliente'

export default async function AdminCNCPVPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any)
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const { data: assinaturas, count } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('id, nome, cpf, whatsapp, email, numero_registro, assinado_em, hash_contrato, pdf_url, pdf_status, status, revogado_em, revogado_motivo', { count: 'exact' })
    .order('assinado_em', { ascending: false })

  return (
    <AdminLayout>
      <CNCPVCliente assinaturasIniciais={assinaturas ?? []} total={count ?? 0} />
    </AdminLayout>
  )
}
