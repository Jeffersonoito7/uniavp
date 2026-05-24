import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'

export const dynamic = 'force-dynamic'

export default async function VerProPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const { data: gestores } = await adminClient.from('gestores')
    .select('id, nome, whatsapp, email, ativo')
    .order('nome')
    .limit(100)

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Ver Painel PRO</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Selecione um PRO para entrar no painel dele e testar como ele vê.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(gestores ?? []).map((g: any) => (
          <div key={g.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{g.nome}</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>
                {g.whatsapp} · {g.email} ·{' '}
                <span style={{ color: g.ativo ? 'var(--avp-green)' : 'var(--avp-danger)', fontWeight: 600 }}>
                  {g.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </p>
            </div>
            <a
              href={`/api/admin/login-como?whatsapp=${g.whatsapp}&tipo=pro`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, background: 'var(--grad-brand)', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              🔑 Entrar como PRO
            </a>
          </div>
        ))}
        {(!gestores || gestores.length === 0) && (
          <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 40 }}>Nenhum PRO cadastrado ainda.</p>
        )}
      </div>
    </AdminLayout>
  )
}
