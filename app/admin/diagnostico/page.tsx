export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

export default async function DiagnosticoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  const { data: superRecord } = !adminRecord
    ? await adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
    : { data: null }
  if (!adminRecord && !superRecord) redirect('/entrar?p=adm')

  const tid = adminRecord?.tenant_id as string | null
  const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

  const [
    { data: alunosSemCpf },
    { data: gestoresSemCpf },
    { data: gestoresSemLink },
    { data: gestoresSemAluno },
    { data: alunosSemGestor },
  ] = await Promise.all([
    tq(adminClient.from('alunos').select('id, nome, whatsapp, email, status').is('cpf', null)).limit(100),
    tq(adminClient.from('gestores' as any).select('id, nome, whatsapp, email, status_assinatura').is('cpf', null)).limit(100),
    tq(adminClient.from('gestores' as any).select('id, nome, whatsapp, status_assinatura').or('link_externo.is.null,link_externo.eq.').eq('ativo', true)).limit(100),
    tq(adminClient.from('gestores' as any).select('id, nome, whatsapp, user_id').is('user_id', null)).limit(50),
    tq(adminClient.from('alunos').select('id, nome, whatsapp, status').is('user_id', null)).limit(50),
  ])

  const Section = ({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) => (
    <div style={{ background: '#0f0f1a', border: `1px solid ${count > 0 ? color : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: count > 0 ? 16 : 0 }}>
        <span style={{ background: count > 0 ? color : '#4ade80', color: '#000', borderRadius: 6, padding: '2px 10px', fontWeight: 800, fontSize: 13 }}>{count}</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: count > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>{title}</span>
        {count === 0 && <span style={{ color: '#4ade80', fontSize: 13 }}>Sem anomalias</span>}
      </div>
      {count > 0 && children}
    </div>
  )

  const Table = ({ rows, cols }: { rows: any[]; cols: { key: string; label: string }[] }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ textAlign: 'left', padding: '8px 12px', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.75)' }}>{row[c.key] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', color: '#fff', padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/admin" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Painel Admin</a>
        <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 8px' }}>/</span>
        <span style={{ color: '#fff', fontSize: 13 }}>Diagnostico de Dados</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Diagnostico de Dados</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>
        Anomalias detectadas no banco. Os contadores incluem apenas registros do tenant atual.
      </p>

      <Section title="Alunos sem CPF" count={alunosSemCpf?.length ?? 0} color="rgba(251,191,36,0.8)">
        <Table rows={alunosSemCpf ?? []} cols={[
          { key: 'nome', label: 'Nome' },
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'email', label: 'E-mail' },
          { key: 'status', label: 'Status' },
        ]} />
      </Section>

      <Section title="Gestores (PRO) sem CPF" count={gestoresSemCpf?.length ?? 0} color="rgba(251,191,36,0.8)">
        <Table rows={gestoresSemCpf ?? []} cols={[
          { key: 'nome', label: 'Nome' },
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'email', label: 'E-mail' },
          { key: 'status_assinatura', label: 'Status' },
        ]} />
      </Section>

      <Section title="Gestores (PRO) ativos sem link de indicacao" count={gestoresSemLink?.length ?? 0} color="rgba(248,113,113,0.8)">
        <Table rows={gestoresSemLink ?? []} cols={[
          { key: 'nome', label: 'Nome' },
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'status_assinatura', label: 'Status' },
        ]} />
      </Section>

      <Section title="Gestores sem user_id (orfaos)" count={gestoresSemAluno?.length ?? 0} color="rgba(248,113,113,0.8)">
        <Table rows={gestoresSemAluno ?? []} cols={[
          { key: 'nome', label: 'Nome' },
          { key: 'whatsapp', label: 'WhatsApp' },
        ]} />
      </Section>

      <Section title="Alunos sem user_id (nunca logaram)" count={alunosSemGestor?.length ?? 0} color="rgba(148,163,184,0.5)">
        <Table rows={alunosSemGestor ?? []} cols={[
          { key: 'nome', label: 'Nome' },
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'status', label: 'Status' },
        ]} />
      </Section>
    </div>
  )
}
