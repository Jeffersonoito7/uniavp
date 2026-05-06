import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import ConsultoresCliente from './ConsultoresCliente'

export default async function ConsultoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/aluno')

  const { data: consultores } = await (adminClient.from('alunos') as any)
    .select('id, nome, whatsapp, email, status, created_at, indicador:indicadores(nome)')
    .order('created_at', { ascending: false })

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Consultores</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Gerencie os consultores cadastrados</p>
      </div>
      <ConsultoresCliente consultoresIniciais={consultores ?? []} />
    </AdminLayout>
  )
}
