import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from './AdminLayout'
import LinksCaptacao from './LinksCapatacao'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { count: totalAlunos } = await (adminClient.from('alunos') as any).select('id', { count: 'exact', head: true })
  const { count: totalModulos } = await (adminClient.from('modulos') as any).select('id', { count: 'exact', head: true })
  const { count: totalAulas } = await (adminClient.from('aulas') as any).select('id', { count: 'exact', head: true })

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Visão geral da plataforma</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Alunos', value: totalAlunos ?? 0 },
          { label: 'Módulos', value: totalModulos ?? 0 },
          { label: 'Aulas', value: totalAulas ?? 0 },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--avp-text)' }}>{stat.value}</p>
          </div>
        ))}
      </div>
      <LinksCaptacao />
    </AdminLayout>
  )
}
