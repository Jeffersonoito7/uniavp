import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/login')

  const { data: configs } = await (adminClient.from('configuracoes') as any).select('*').order('chave')

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Configurações</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Configurações da plataforma Uni AVP</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(configs ?? []).map((c: any) => (
          <div key={c.chave} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace', color: 'var(--avp-green)' }}>{c.chave}</p>
            </div>
            {c.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }}>{c.descricao}</p>}
            <p style={{ fontSize: 13, color: 'var(--avp-text)', background: 'var(--avp-black)', borderRadius: 6, padding: '6px 10px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {JSON.stringify(c.valor)}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
