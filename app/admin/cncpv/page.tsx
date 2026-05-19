import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import AdminLayout from '../AdminLayout'
import Link from 'next/link'

export default async function AdminCNCPVPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')
  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await (adminClient.from('admins') as any).select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const { data: assinaturas, count } = await (adminClient.from('cncpv_assinaturas') as any)
    .select('id, nome, cpf, whatsapp, email, numero_registro, assinado_em, hash_contrato', { count: 'exact' })
    .order('assinado_em', { ascending: false })

  function mascaraCPF(cpf: string | null) {
    if (!cpf) return '—'
    const d = cpf.replace(/\D/g, '')
    return d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf
  }

  function mascaraWpp(w: string) {
    const d = w.replace(/\D/g, '')
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
    return w
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>🪪 CNCPV</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            Carteiras emitidas — {count ?? 0} assinaturas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '20px' }}>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Total Emitidas</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#02A153', margin: 0 }}>{count ?? 0}</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '20px' }}>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Com Hash SHA-256</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#c8a535', margin: 0 }}>
            {(assinaturas ?? []).filter((a: any) => a.hash_contrato).length}
          </p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '20px' }}>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Este mês</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: '#6366f1', margin: 0 }}>
            {(assinaturas ?? []).filter((a: any) => {
              const d = new Date(a.assinado_em)
              const n = new Date()
              return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
            }).length}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'rgba(255,255,255,0.02)' }}>
                {['Registro', 'Nome', 'CPF', 'WhatsApp', 'E-mail', 'Emissão', 'Hash', 'Verificar'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(assinaturas ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>
                    Nenhuma carteira emitida ainda
                  </td>
                </tr>
              ) : (assinaturas ?? []).map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'monospace', color: '#02A153', fontWeight: 700, fontSize: 13 }}>{a.numero_registro}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--avp-text)' }}>{a.nome}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>{mascaraCPF(a.cpf)}</td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const d = a.whatsapp.replace(/\D/g, '')
                      const ddi = d.startsWith('55') ? d : `55${d}`
                      return (
                        <a href={`https://wa.me/${ddi}`} target="_blank" rel="noreferrer"
                          style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 500 }}>
                          {mascaraWpp(a.whatsapp)}
                        </a>
                      )
                    })()}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{a.email}</td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--avp-text-dim)', fontSize: 12 }}>
                    {new Date(a.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {a.hash_contrato ? (
                      <span title={a.hash_contrato}
                        style={{ fontFamily: 'monospace', fontSize: 10, color: '#c8a535', background: 'rgba(200,165,53,0.08)', border: '1px solid rgba(200,165,53,0.2)', borderRadius: 4, padding: '2px 6px' }}>
                        {a.hash_contrato.slice(0, 12)}…
                      </span>
                    ) : <span style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/cncpv/verificar/${a.numero_registro}`} target="_blank"
                      style={{ color: '#6366f1', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
