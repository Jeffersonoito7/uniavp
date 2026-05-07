import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export default async function AdminsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id, role').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: admins } = await (adminClient.from('admins') as any).select('id, nome, email, role, ativo, created_at').order('created_at')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Admins</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Usuários com acesso ao painel administrativo</p>
      </div>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
              {['Nome', 'E-mail', 'Perfil', 'Status', 'Cadastro'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(admins ?? []).map((a: any) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--avp-text)' }}>{a.nome}</td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{a.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: a.role === 'super_admin' ? '#33368720' : 'var(--avp-border)', color: a.role === 'super_admin' ? '#6366f1' : 'var(--avp-text-dim)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{a.role}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: a.ativo ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, fontWeight: 600 }}>{a.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
