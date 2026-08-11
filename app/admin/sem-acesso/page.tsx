export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { SemAcessoTabela } from './SemAcessoTabela'

const CHUNK = 100

export default async function SemAcessoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const tid = adminRecord.tenant_id as string | null
  const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

  // Busca todos os alunos
  const { data: todosAlunos } = await tq(
    adminClient.from('alunos')
      .select('id, nome, whatsapp, email, created_at, gestor_nome, gestor_whatsapp, status')
      .order('created_at', { ascending: false })
  )
  const todos = todosAlunos ?? []
  const idsAlunos = todos.map((a: any) => a.id as string)

  if (idsAlunos.length === 0) {
    return (
      <div style={{ color: 'var(--avp-text-dim)', padding: 40 }}>Nenhum aluno cadastrado.</div>
    )
  }

  // Descobre quem tem pelo menos 1 aula aprovada
  const idsComProgresso = new Set<string>()
  for (let i = 0; i < idsAlunos.length; i += CHUNK) {
    const { data: prog } = await adminClient.from('progresso')
      .select('aluno_id')
      .eq('aprovado', true)
      .in('aluno_id', idsAlunos.slice(i, i + CHUNK))
    for (const p of prog ?? []) idsComProgresso.add(p.aluno_id)
  }

  const semAcesso = todos.filter((a: any) => !idsComProgresso.has(a.id))

  // Agrupa por gestor para o painel de resumo
  const porGestor: Record<string, { nome: string; whatsapp: string | null; count: number }> = {}
  for (const a of semAcesso) {
    const key = (a.gestor_nome as string | null) ?? '__admin__'
    if (!porGestor[key]) porGestor[key] = { nome: a.gestor_nome ?? 'Cadastrados pelo Admin', whatsapp: a.gestor_whatsapp ?? null, count: 0 }
    porGestor[key].count++
  }
  const resumoGestores = Object.values(porGestor).sort((a, b) => b.count - a.count)

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 13 }}>Dashboard</Link>
          <span style={{ color: 'var(--avp-text-dim)' }}>/</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--avp-text)', letterSpacing: '-0.02em', margin: 0 }}>
            Alunos sem acesso
          </h1>
        </div>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 6 }}>
          {semAcesso.length} aluno{semAcesso.length !== 1 ? 's' : ''} cadastrado{semAcesso.length !== 1 ? 's' : ''} que nunca abriu nenhuma aula
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--avp-text-dim)', marginBottom: 8 }}>Total sem acesso</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#f87171', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{semAcesso.length}</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>de {todos.length} cadastrados ({Math.round(semAcesso.length / Math.max(todos.length, 1) * 100)}%)</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--avp-text-dim)', marginBottom: 8 }}>Com WhatsApp</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {semAcesso.filter((a: any) => a.whatsapp).length}
          </p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>podem receber lembrete</p>
        </div>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--avp-text-dim)', marginBottom: 8 }}>Gestores envolvidos</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#818cf8', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{resumoGestores.length}</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>cadastraram esses alunos</p>
        </div>
      </div>

      {/* Resumo por gestor */}
      {resumoGestores.length > 0 && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', marginBottom: 14 }}>
            Por gestor responsavel
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resumoGestores.map(g => (
              <div key={g.nome} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text)' }}>{g.nome}</span>
                  {g.whatsapp && <span style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginLeft: 8 }}>{g.whatsapp}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#f87171', width: `${Math.round(g.count / semAcesso.length * 100)}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171', minWidth: 28, textAlign: 'right' }}>{g.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', marginBottom: 16 }}>
          Lista completa
        </p>
        <SemAcessoTabela alunos={semAcesso.map((a: any) => ({
          id: a.id,
          nome: a.nome,
          whatsapp: a.whatsapp ?? null,
          email: a.email ?? null,
          created_at: a.created_at,
          gestor_nome: a.gestor_nome ?? null,
          gestor_whatsapp: a.gestor_whatsapp ?? null,
        }))} />
      </div>
    </>
  )
}
