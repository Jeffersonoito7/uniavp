export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function RelatorioConclusaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?p=adm')

  const adminClient = createServiceRoleClient()
  const { data: adminRecord } = await adminClient.from('admins')
    .select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
  if (!adminRecord) redirect('/entrar?p=adm')

  const tid = adminRecord.tenant_id as string | null
  const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

  // ── 1. Contagens gerais de alunos por status ──
  const [
    { count: totalAlunos },
    { count: totalAtivos },
    { count: totalConcluidos },
    { count: totalInativos },
    { count: comCertificado },
    { count: semUserid },
  ] = await Promise.all([
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'ativo'),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'concluido'),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'inativo'),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).not('numero_registro', 'is', null),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).is('user_id', null),
  ])

  // ── 2. Aulas obrigatorias publicadas ──
  let aulasQ = (adminClient.from('aulas') as any)
    .select('id, titulo, modulo:modulos!inner(titulo, perfis_permitidos, publicado)')
    .eq('publicado', true)
    .eq('modulos.publicado', true)
  if (tid) aulasQ = aulasQ.eq('tenant_id', tid)
  const { data: todasAulasRaw } = await aulasQ
  const aulasObrigatorias = (todasAulasRaw ?? []).filter((a: any) => {
    const perfis = a.modulo?.perfis_permitidos ?? []
    return Array.isArray(perfis) && perfis.includes('consultor')
  })
  const totalAulasObrig = aulasObrigatorias.length
  const idsAulasObrig = aulasObrigatorias.map((a: any) => a.id as string)

  // ── 3. Alunos ativos com progresso — quantos aprovaram pelo menos 1 aula ──
  const { data: alunosAtivosRows } = await tq(
    adminClient.from('alunos').select('id, nome, whatsapp, status').eq('status', 'ativo')
  )
  const idsAtivos = (alunosAtivosRows ?? []).map((a: any) => a.id as string)

  // Conta aulas aprovadas por aluno (em batches)
  const aprovacoesPorAluno: Record<string, number> = {}
  const CHUNK = 100
  if (idsAtivos.length > 0 && idsAulasObrig.length > 0) {
    for (let i = 0; i < idsAtivos.length; i += CHUNK) {
      const { data: prog } = await adminClient.from('progresso')
        .select('aluno_id, aula_id')
        .eq('aprovado', true)
        .in('aluno_id', idsAtivos.slice(i, i + CHUNK))
        .in('aula_id', idsAulasObrig)
      for (const p of prog ?? []) {
        aprovacoesPorAluno[p.aluno_id] = (aprovacoesPorAluno[p.aluno_id] ?? 0) + 1
      }
    }
  }

  const nuncaComecou = idsAtivos.filter((id: string) => !aprovacoesPorAluno[id]).length
  const emAndamento = idsAtivos.filter((id: string) => {
    const n = aprovacoesPorAluno[id] ?? 0
    return n > 0 && n < totalAulasObrig
  }).length
  const concluiuMasNaoMarcado = idsAtivos.filter((id: string) =>
    (aprovacoesPorAluno[id] ?? 0) >= totalAulasObrig
  ).length

  // ── 4. Concluídos por mês ──
  const { data: concluidosPorMes } = await tq(
    adminClient.from('alunos')
      .select('data_formacao')
      .eq('status', 'concluido')
      .not('data_formacao', 'is', null)
      .order('data_formacao', { ascending: false })
  )
  const porMes: Record<string, number> = {}
  for (const a of concluidosPorMes ?? []) {
    const mes = (a.data_formacao as string).substring(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + 1
  }
  const meses = Object.entries(porMes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12)

  // ── 5. Modulos com quantas aulas obrigatorias ──
  const moduloMap: Record<string, { titulo: string; count: number }> = {}
  for (const a of aulasObrigatorias) {
    const mod = a.modulo?.titulo ?? 'Sem módulo'
    moduloMap[mod] = { titulo: mod, count: (moduloMap[mod]?.count ?? 0) + 1 }
  }
  const modulosList = Object.values(moduloMap).sort((a, b) => b.count - a.count)

  const card = (label: string, value: number | string, sub: string, cor: string) => (
    <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 800, color: cor, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{value}</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{sub}</p>
    </div>
  )

  const pct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : '0%'

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', margin: 0 }}>Relatório de Conclusão</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
          Por que {totalAlunos} alunos e apenas {totalConcluidos} concluíram? Veja o diagnóstico completo.
        </p>
      </div>

      {/* Cards gerais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
        {card('Total de Alunos', totalAlunos ?? 0, 'cadastrados', '#818cf8')}
        {card('Ativos', totalAtivos ?? 0, pct(totalAtivos ?? 0, totalAlunos ?? 1) + ' do total', '#60a5fa')}
        {card('Concluíram', totalConcluidos ?? 0, pct(totalConcluidos ?? 0, totalAlunos ?? 1) + ' do total', '#4ade80')}
        {card('Inativos', totalInativos ?? 0, pct(totalInativos ?? 0, totalAlunos ?? 1) + ' do total', '#f87171')}
        {card('Com Certificado', comCertificado ?? 0, 'número de registro emitido', '#fbbf24')}
        {card('Nunca Acessaram', semUserid ?? 0, 'sem user_id (nunca logaram)', '#94a3b8')}
      </div>

      {/* Explicação do funil dos ativos */}
      <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--avp-text)' }}>
          Funil dos {totalAtivos} alunos ATIVOS
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          Trilha obrigatória: <strong style={{ color: '#fff' }}>{totalAulasObrig} aulas</strong> em <strong style={{ color: '#fff' }}>{modulosList.length} módulos</strong>
        </p>

        {[
          { label: 'Nunca começaram nenhuma aula', value: nuncaComecou, cor: '#f87171', desc: 'Cadastraram mas nunca fizeram login ou acessaram o conteúdo' },
          { label: 'Em andamento', value: emAndamento, cor: '#fbbf24', desc: 'Aprovaram pelo menos 1 aula mas não completaram a trilha toda' },
          { label: 'Completaram todas as aulas mas não foram marcados como concluídos', value: concluiuMasNaoMarcado, cor: '#f97316', desc: 'Clique em "Recalcular Conclusões" no dashboard para corrigir' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: item.cor + '20', border: `2px solid ${item.cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: item.cor }}>{item.value}</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.desc}</p>
            </div>
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.cor }}>{pct(item.value, totalAtivos ?? 1)}</span>
            </div>
          </div>
        ))}

        {concluiuMasNaoMarcado > 0 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8 }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>
              Acao necessaria: {concluiuMasNaoMarcado} aluno{concluiuMasNaoMarcado > 1 ? 's' : ''} precisam ser marcado{concluiuMasNaoMarcado > 1 ? 's' : ''} como concluído{concluiuMasNaoMarcado > 1 ? 's' : ''}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
              Va ao Dashboard e clique em "Recalcular Conclusões" para corrigir automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* Módulos da trilha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--avp-text)' }}>Módulos da Trilha Obrigatória</h2>
          {modulosList.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Nenhum módulo publicado para consultores.</p>
          ) : modulosList.map(m => (
            <div key={m.titulo} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{m.titulo}</span>
              <span style={{ color: '#818cf8', fontWeight: 700 }}>{m.count} aula{m.count > 1 ? 's' : ''}</span>
            </div>
          ))}
          <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Total: {totalAulasObrig} aulas para concluir</p>
        </div>

        <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--avp-text)' }}>Conclusões por Mês</h2>
          {meses.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Nenhuma conclusão registrada.</p>
          ) : meses.map(([mes, qtd]) => {
            const [ano, m] = mes.split('-')
            const nomeMes = new Date(Number(ano), Number(m) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
            return (
              <div key={mes} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{nomeMes}</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{qtd} concluído{qtd > 1 ? 's' : ''}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Acao */}
      <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 4px' }}>Resumo da discrepância</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            De {totalAlunos} alunos: {semUserid} nunca acessaram, {totalInativos} estão inativos, {nuncaComecou} ativos nunca começaram, {emAndamento} estão em andamento — por isso apenas {totalConcluidos} concluíram.
          </p>
        </div>
        <Link href="/admin" style={{ background: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Ir ao Dashboard
        </Link>
      </div>
    </div>
  )
}
