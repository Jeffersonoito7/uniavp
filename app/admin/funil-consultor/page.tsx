import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import { redirect } from 'next/navigation'
import FunilConsultorCliente from './FunilConsultorCliente'

export const dynamic = 'force-dynamic'

export default async function FunilConsultorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) redirect('/admin/login')

  let q = (adminClient.from('funil_perguntas' as any) as any)
    .select('id, ordem, texto, alternativas, ativa')
    .order('ordem')
  q = ctx.tenantId ? q.eq('tenant_id', ctx.tenantId) : q.is('tenant_id', null)
  const { data: perguntas } = await q

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <FunilConsultorCliente perguntasIniciais={perguntas ?? []} />
    </div>
  )
}
