import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import Link from 'next/link'
import ContratoObrigatorioConfig from './ContratoObrigatorioConfig'

export const dynamic = 'force-dynamic'

export default async function ContratosPage() {
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

  // Busca contratos digitais
  let q = adminClient
    .from('contratos_digitais')
    .select('id, titulo, numero_registro, status, tipo, created_at, contrato_base_id')
    .order('created_at', { ascending: false })
    .limit(50)
  if (tid) q = q.eq('tenant_id', tid)
  const { data: contratos } = await q

  // Busca templates
  let tq = adminClient
    .from('contrato_templates')
    .select('id, nome, ativo', { count: 'exact' })
    .eq('arquivado', false)
  if (tid) tq = tq.eq('tenant_id', tid)
  const { data: templates, count: totalTemplates } = await tq

  // Config de contrato obrigatorio
  let cfgQ = adminClient.from('configuracoes').select('valor').eq('chave', 'contrato_digital_obrigatorio_id')
  if (tid) cfgQ = cfgQ.eq('tenant_id', tid)
  const { data: cfgObrigatorio } = await cfgQ.maybeSingle()
  const templateObrigatorioId = cfgObrigatorio?.valor
    ? (typeof cfgObrigatorio.valor === 'string' ? cfgObrigatorio.valor.replace(/"/g, '').trim() : String(cfgObrigatorio.valor).trim())
    : null

  const statusCor: Record<string, string> = {
    rascunho: '#6b7280',
    enviado: '#f59e0b',
    parcialmente_assinado: '#3b82f6',
    concluido: '#02A153',
    cancelado: '#e63946',
  }
  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    enviado: 'Aguardando assinaturas',
    parcialmente_assinado: 'Parcialmente assinado',
    concluido: 'Concluido',
    cancelado: 'Cancelado',
  }

  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Contratos Digitais</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
          Gerencie contratos, aditivos e templates com assinatura digital.
        </p>
      </div>

      {/* Contrato obrigatorio */}
      <ContratoObrigatorioConfig
        templates={(templates ?? []).filter((t: any) => t.ativo).map((t: any) => ({ id: t.id, nome: t.nome }))}
        templateAtualId={templateObrigatorioId}
      />

      {/* Acoes rapidas */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Link href="/admin/contratos/novo" style={{ background: 'var(--avp-green)', color: '#fff', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          + Novo Contrato
        </Link>
        <Link href="/admin/contratos/templates" style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Templates ({totalTemplates ?? 0})
        </Link>
        <Link href="/admin/contratos/antigos" style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          Contratos legados
        </Link>
      </div>

      {/* Lista de contratos digitais */}
      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Numero', 'Titulo', 'Tipo', 'Status', 'Data', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(contratos ?? []).map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13, fontFamily: 'monospace' }}>{c.numero_registro}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text)', fontWeight: 600, fontSize: 14 }}>
                    {c.titulo}
                    {c.tipo === 'aditivo' && (
                      <span style={{ marginLeft: 8, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 6, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>Aditivo</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    {c.tipo === 'aditivo' ? 'Aditivo' : 'Principal'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: (statusCor[c.status] ?? '#6b7280') + '20', color: statusCor[c.status] ?? '#6b7280', border: `1px solid ${(statusCor[c.status] ?? '#6b7280')}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/admin/contratos/${c.id}`} style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {(!contratos || contratos.length === 0) && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--avp-text-dim)' }}>
                    Nenhum contrato digital criado ainda.{' '}
                    <Link href="/admin/contratos/novo" style={{ color: 'var(--avp-blue)', fontWeight: 700 }}>Criar o primeiro</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
