import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../../AdminLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContratosAntigosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
    adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
    adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
  ])
  if (!adminRecord && !superRecord) redirect('/entrar?p=adm')
  const tid = (adminRecord?.tenant_id ?? null) as string | null

  // Busca contratos que foram cancelados ou sao aditivos de versoes antigas
  let q = (adminClient.from('contratos_digitais' as any) as any)
    .select('id, titulo, numero_registro, status, tipo, created_at')
    .in('status', ['cancelado'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (tid) q = q.eq('tenant_id', tid)
  const { data: contratos } = await q

  const statusCor: Record<string, string> = { cancelado: '#e63946' }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/contratos" style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>← Contratos</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>Contratos legados</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Contratos cancelados ou arquivados. Somente leitura.</p>
      </div>

      {(!contratos || contratos.length === 0) ? (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--avp-text-dim)' }}>
          Nenhum contrato legado encontrado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(contratos as { id: string; titulo: string; numero_registro: string; status: string; tipo: string; created_at: string }[]).map(c => (
            <Link key={c.id} href={`/admin/contratos/${c.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', color: 'var(--avp-text)' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{c.titulo}</p>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '4px 0 0', fontFamily: 'monospace' }}>{c.numero_registro}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span style={{ background: (statusCor[c.status] ?? '#6b7280') + '20', color: statusCor[c.status] ?? '#6b7280', border: `1px solid ${(statusCor[c.status] ?? '#6b7280')}40`, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Cancelado
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
