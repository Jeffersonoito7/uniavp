import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import PremiosCliente from './PremiosCliente'

export default async function PremiosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/aluno')

  const { data: premios } = await (adminClient.from('premios') as any).select('*').order('created_at', { ascending: false })
  const { data: resgates } = await (adminClient.from('resgates') as any)
    .select('*, aluno:alunos(nome), premio:premios(nome)')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Prêmios</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie prêmios da loja e resgates dos alunos</p>
      </div>
      <PremiosCliente premiosIniciais={premios ?? []} resgatesIniciais={resgates ?? []} />
    </AdminLayout>
  )
}
