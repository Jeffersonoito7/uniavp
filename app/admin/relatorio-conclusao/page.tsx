export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { GraficoMeses } from './GraficosRelatorio'

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

  // ── 1. Contagens gerais ──
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
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).not('numero_registro', 'is', null).neq('numero_registro', ''),
    tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).is('user_id', null),
  ])

  // ── 2. Módulos e aulas publicados ──
  let aulasQ = (adminClient.from('aulas') as any)
    .select('id, titulo, modulo_id, modulo:modulos!inner(id, titulo, ordem, perfis_permitidos, publicado)')
    .eq('publicado', true)
    .eq('modulos.publicado', true)
  if (tid) aulasQ = aulasQ.eq('tenant_id', tid)
  const { data: todasAulasRaw } = await aulasQ

  const aulasObrigatorias = (todasAulasRaw ?? []).filter((a: any) => {
    const perfis = a.modulo?.perfis_permitidos ?? []
    return Array.isArray(perfis) && perfis.includes('consultor')
  })

  // Agrupa aulas por módulo
  const modulosMap: Record<string, { id: string; titulo: string; ordem: number; aulaIds: string[] }> = {}
  for (const a of aulasObrigatorias) {
    const mid = a.modulo?.id ?? a.modulo_id ?? 'sem-modulo'
    if (!modulosMap[mid]) {
      modulosMap[mid] = {
        id: mid,
        titulo: a.modulo?.titulo ?? 'Sem módulo',
        ordem: a.modulo?.ordem ?? 999,
        aulaIds: [],
      }
    }
    modulosMap[mid].aulaIds.push(a.id as string)
  }
  const modulos = Object.values(modulosMap).sort((a, b) => a.ordem - b.ordem)
  const totalAulasObrig = aulasObrigatorias.length
  const idsAulasObrig = aulasObrigatorias.map((a: any) => a.id as string)

  // ── 3. Alunos ativos e concluídos (para calcular progresso) ──
  const { data: alunosAtivosRows } = await tq(
    adminClient.from('alunos').select('id').eq('status', 'ativo')
  )
  const idsAtivos = (alunosAtivosRows ?? []).map((a: any) => a.id as string)

  // Todos os alunos do sistema (para contar quem concluiu o Módulo 1)
  const { data: todosAlunosRows } = await tq(
    adminClient.from('alunos').select('id')
  )
  const idsTodos = (todosAlunosRows ?? []).map((a: any) => a.id as string)
  // Ativos + concluídos para o funil de progresso
  const { data: alunosConcluidosRows } = await tq(
    adminClient.from('alunos').select('id').eq('status', 'concluido')
  )
  const idsConcluidos = (alunosConcluidosRows ?? []).map((a: any) => a.id as string)
  const idsTodosCursando = [...idsAtivos, ...idsConcluidos]

  // Aprovações por aluno (batches de 100) — para todos os alunos do sistema
  const aprovacoesPorAlunoEAula: Record<string, Set<string>> = {}
  const CHUNK = 100
  if (idsTodos.length > 0 && idsAulasObrig.length > 0) {
    for (let i = 0; i < idsTodos.length; i += CHUNK) {
      const { data: prog } = await adminClient.from('progresso')
        .select('aluno_id, aula_id')
        .eq('aprovado', true)
        .in('aluno_id', idsTodos.slice(i, i + CHUNK))
        .in('aula_id', idsAulasObrig)
      for (const p of prog ?? []) {
        if (!aprovacoesPorAlunoEAula[p.aluno_id]) aprovacoesPorAlunoEAula[p.aluno_id] = new Set()
        aprovacoesPorAlunoEAula[p.aluno_id].add(p.aula_id)
      }
    }
  }

  // Contagem geral para o funil global (só ativos)
  const nuncaComecou = idsAtivos.filter((id: string) => !aprovacoesPorAlunoEAula[id]).length
  const emAndamento = idsAtivos.filter((id: string) => {
    const n = aprovacoesPorAlunoEAula[id]?.size ?? 0
    return n > 0 && n < totalAulasObrig
  }).length
  const concluiuMasNaoMarcado = idsAtivos.filter((id: string) =>
    (aprovacoesPorAlunoEAula[id]?.size ?? 0) >= totalAulasObrig
  ).length

  // ── 4. Stats por módulo (ativos para funil; todos para módulo 1) ──
  const modulo1 = modulos[0] ?? null
  const aulasMod1 = modulo1 ? new Set(modulo1.aulaIds) : new Set<string>()

  // Quem concluiu o Módulo 1 — TODOS os alunos do sistema (ativos, concluídos, inativos)
  const concluiramMod1 = idsTodos.filter((id: string) => {
    if (aulasMod1.size === 0) return false
    const aprovadas = aprovacoesPorAlunoEAula[id]
    if (!aprovadas) return false
    for (const aid of aulasMod1) { if (!aprovadas.has(aid)) return false }
    return true
  }).length

  const statsPorModulo = modulos.map((mod, idx) => {
    const totalAulas = mod.aulaIds.length
    const aulaSet = new Set(mod.aulaIds)

    let concluiramModulo = 0
    let emAndamentoModulo = 0
    let nuncaComecouModulo = 0

    // Módulo 1: contar sobre todos (ativos+concluídos); demais: só ativos
    const baseIds = idx === 0 ? idsTodosCursando : idsAtivos
    for (const id of baseIds) {
      const aprovadas = aprovacoesPorAlunoEAula[id]
      let qtd = 0
      if (aprovadas) {
        for (const aid of aulaSet) {
          if (aprovadas.has(aid)) qtd++
        }
      }
      if (qtd === 0) nuncaComecouModulo++
      else if (qtd >= totalAulas) concluiramModulo++
      else emAndamentoModulo++
    }

    const totalAtivosNum = idx === 0 ? idsTodosCursando.length : idsAtivos.length
    return { ...mod, totalAulas, concluiramModulo, emAndamentoModulo, nuncaComecouModulo, totalAtivosNum }
  })

  // ── 5. Conclusões por mês ──
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
  const meses = Object.entries(porMes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12) as [string, number][]

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
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', margin: 0 }}>Relatório de Conclusão</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
            Por que {totalAlunos} alunos e apenas {totalConcluidos} concluíram? Veja o diagnóstico por módulo.
          </p>
        </div>
        <a
          href="/api/admin/relatorio/exportar-csv"
          download
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--avp-card)', color: 'var(--avp-text)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <Download size={14} />
          Exportar CSV
        </a>
      </div>

      {/* Cards gerais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
        {card('Total de Alunos', totalAlunos ?? 0, 'cadastrados', '#818cf8')}
        {card('Ativos', totalAtivos ?? 0, pct(totalAtivos ?? 0, totalAlunos ?? 1) + ' do total', '#60a5fa')}
        {card('Concluíram', totalConcluidos ?? 0, pct(totalConcluidos ?? 0, totalAlunos ?? 1) + ' do total', '#4ade80')}
        {card('Inativos', totalInativos ?? 0, pct(totalInativos ?? 0, totalAlunos ?? 1) + ' do total', '#f87171')}
        {card('Concluíram Módulo 1', concluiramMod1, 'ativos + concluídos que passaram em todas as aulas', '#fbbf24')}
        {card('Nunca Acessaram', semUserid ?? 0, 'sem user_id — nunca logaram', '#94a3b8')}
      </div>

      {/* Progresso por módulo */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--avp-text)', margin: '0 0 16px' }}>
        Progresso dos {idsAtivos.length} alunos ativos — por módulo
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {statsPorModulo.map((mod, idx) => {
          const emiteCertificado = idx === 0
          const pctConc = mod.totalAtivosNum > 0 ? (mod.concluiramModulo / mod.totalAtivosNum) * 100 : 0
          const pctAnd = mod.totalAtivosNum > 0 ? (mod.emAndamentoModulo / mod.totalAtivosNum) * 100 : 0
          return (
            <div
              key={mod.id}
              style={{ background: '#0f1729', border: emiteCertificado ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: emiteCertificado ? 'rgba(251,191,36,0.15)' : 'rgba(129,140,248,0.12)', border: emiteCertificado ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(129,140,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: emiteCertificado ? '#fbbf24' : '#818cf8' }}>{idx + 1}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{mod.titulo}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                      {mod.totalAulas} aula{mod.totalAulas !== 1 ? 's' : ''}
                      {emiteCertificado ? ' — emite certificado' : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', margin: 0 }}>{mod.concluiramModulo}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>concluíram</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', margin: 0 }}>{mod.emAndamentoModulo}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>em andamento</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#f87171', margin: 0 }}>{mod.nuncaComecouModulo}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0 }}>não começaram</p>
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', width: `${pctConc}%`, background: '#4ade80' }} />
                <div style={{ height: '100%', width: `${pctAnd}%`, background: '#fbbf24' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#4ade80' }}>{Math.round(pctConc)}% concluíram</span>
                <span style={{ fontSize: 11, color: '#fbbf24' }}>{Math.round(pctAnd)}% em andamento</span>
                <span style={{ fontSize: 11, color: '#f87171' }}>{pct(mod.nuncaComecouModulo, mod.totalAtivosNum)} não iniciaram</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Funil global dos ativos */}
      <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: 'var(--avp-text)' }}>
          Situação geral dos {totalAtivos} ativos (trilha completa)
        </h2>

        {[
          { label: 'Nunca começaram nenhuma aula', value: nuncaComecou, cor: '#f87171', desc: 'Cadastraram mas nunca acessaram nenhum conteúdo' },
          { label: 'Em andamento', value: emAndamento, cor: '#fbbf24', desc: 'Aprovaram pelo menos 1 aula mas não completaram a trilha toda' },
          { label: 'Completaram mas não foram marcados como concluídos', value: concluiuMasNaoMarcado, cor: '#f97316', desc: 'Clique em "Recalcular Conclusões" no dashboard para corrigir' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: item.cor + '20', border: `2px solid ${item.cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: item.cor }}>{item.value}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.desc}</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.cor, flexShrink: 0 }}>{pct(item.value, totalAtivos ?? 1)}</span>
          </div>
        ))}

        {concluiuMasNaoMarcado > 0 && (
          <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8 }}>
            <p style={{ color: '#f97316', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>
              Acao necessaria: {concluiuMasNaoMarcado} aluno{concluiuMasNaoMarcado > 1 ? 's' : ''} precisam ser marcado{concluiuMasNaoMarcado > 1 ? 's' : ''} como concluídos
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
              Va ao Dashboard e clique em "Recalcular Conclusões".
            </p>
          </div>
        )}
      </div>

      {/* Gráfico de conclusões por mês */}
      <div style={{ marginBottom: 24 }}>
        <GraficoMeses meses={meses} />
      </div>

      {/* Resumo */}
      <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 4px' }}>Resumo</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            De {totalAlunos} alunos: {semUserid} nunca acessaram, {totalInativos} estão inativos, {nuncaComecou} ativos nunca começaram, {emAndamento} estão em andamento. {totalConcluidos} concluíram a trilha toda — {concluiramMod1} passaram em todas as aulas do Módulo 1 (critério real do certificado).
          </p>
        </div>
        <Link href="/admin" style={{ background: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Ir ao Dashboard
        </Link>
      </div>
    </div>
  )
}
