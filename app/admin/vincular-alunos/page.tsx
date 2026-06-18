import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getAdminContext } from '@/lib/admin-context'
import AdminLayout from '../AdminLayout'
import VincularAlunosCliente from './VincularAlunosCliente'

export const dynamic = 'force-dynamic'

export default async function VincularAlunosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const ctx = await getAdminContext(user.id, adminClient)
  if (!ctx) redirect('/entrar?p=adm')

  const tid = ctx.tenantId ?? null

  // Alunos sem gestor_whatsapp no tenant
  let q = adminClient.from('alunos')
    .select('id, nome, whatsapp, email, gestor_whatsapp, gestor_nome, created_at')
    .or('gestor_whatsapp.is.null,gestor_whatsapp.eq.')
    .order('created_at', { ascending: false })
    .limit(200)
  if (tid) q = q.eq('tenant_id', tid)
  const { data: semGestor } = await q

  // Gestores disponiveis
  let gq = adminClient.from('gestores')
    .select('id, nome, whatsapp, ativo, status_assinatura')
    .order('nome')
  if (tid) gq = gq.eq('tenant_id', tid)
  const { data: gestores } = await gq

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)' }}>Vincular Alunos a PRO</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Corrija alunos que estao desvinculados ou com formato de whatsapp diferente do PRO.
        </p>
      </div>

      <VincularAlunosCliente
        semGestor={semGestor ?? []}
        gestores={gestores ?? []}
      />

      <div style={{ marginTop: 28 }}>
        <a href='/admin' style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'underline' }}>Voltar ao admin</a>
      </div>
    </AdminLayout>
  )
}
