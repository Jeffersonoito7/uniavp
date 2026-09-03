export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import LinksTeste from './LinksTeste'
import Link from 'next/link'
import { DashboardBI } from './DashboardGraficos'
import DashboardFiltro from './DashboardFiltro'
import DashboardPeriodo from './DashboardPeriodo'

import { DOMINIO_MASTER } from '@/lib/constants'

function calcularPeriodo(periodo: string, inicioStr?: string, fimStr?: string) {
  const agora = new Date()
  let inicio: Date, fim: Date, label: string

  if (periodo === 'mes_anterior') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    fim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999)
    label = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else if (periodo === '3_meses') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 2, 1)
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
    label = 'Últimos 3 meses'
  } else if (periodo === '6_meses') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
    label = 'Últimos 6 meses'
  } else if (periodo === 'ano_atual') {
    inicio = new Date(agora.getFullYear(), 0, 1)
    fim = new Date(agora.getFullYear(), 11, 31, 23, 59, 59, 999)
    label = `Ano ${agora.getFullYear()}`
  } else if (periodo === 'personalizado' && inicioStr && fimStr) {
    inicio = new Date(inicioStr + 'T00:00:00')
    fim = new Date(fimStr + 'T23:59:59')
    label = `${new Date(inicioStr).toLocaleDateString('pt-BR')} a ${new Date(fimStr).toLocaleDateString('pt-BR')}`
  } else {
    // mes_atual (default)
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999)
    label = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const diffMs = fim.getTime() - inicio.getTime()
  const inicioPrev = new Date(inicio.getTime() - diffMs - 1)
  const fimPrev = new Date(inicio.getTime() - 1)

  return { inicio, fim, label, inicioPrev, fimPrev }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: { periodo?: string; inicio?: string; fim?: string }
}) {
 const host = (await headers()).get('host')?.replace(/:\d+$/, '') ?? ''
 const isMaster = host === DOMINIO_MASTER || host === 'localhost'

 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=adm')
 const adminClient = createServiceRoleClient()
 const { data: adminRecord } = await adminClient.from('admins').select('id, tenant_id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 if (!adminRecord) redirect('/entrar?p=adm')
 const tid = adminRecord.tenant_id as string | null
 const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

 const [
   { count: totalAlunos },
   { count: alunosAtivos },
   { count: alunosConcluidos },
   { count: totalAulas },
   { count: aulasPublicadas },
   { count: totalGestores },
   { count: gestoresAtivos },
 ] = await Promise.all([
   tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })),
   tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).eq('status', 'ativo'),
   tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).not('data_formacao', 'is', null),
   tq(adminClient.from('aulas').select('id', { count: 'exact', head: true })),
   tq(adminClient.from('aulas').select('id', { count: 'exact', head: true })).eq('publicado', true),
   tq(adminClient.from('gestores').select('id', { count: 'exact', head: true })),
   tq(adminClient.from('gestores').select('id', { count: 'exact', head: true })).eq('ativo', true),
 ])

 const taxaConclusao = totalAlunos ? Math.round(((alunosConcluidos ?? 0) / (totalAlunos ?? 1)) * 100) : 0

 // Progresso médio dos ativos
 const totalAulasPublicadasN = aulasPublicadas ?? 1
 let mediaProgresso = 0
 let nuncaComecou = 0
 let emAndamento = 0
 let concluiuMasNaoMarcado = 0
 {
   const { data: alunosAtivosRows } = await tq(
     adminClient.from('alunos').select('id').eq('status', 'ativo')
   )
   const idsAtivos = (alunosAtivosRows ?? []).map((a: any) => a.id as string)
   if (idsAtivos.length > 0) {
     const CHUNK = 100
     const aprovacoesPorAluno: Record<string, number> = {}
     for (let i = 0; i < idsAtivos.length; i += CHUNK) {
       const { data } = await adminClient
         .from('progresso')
         .select('aluno_id')
         .eq('aprovado', true)
         .in('aluno_id', idsAtivos.slice(i, i + CHUNK))
       for (const r of data ?? []) {
         const id = (r as any).aluno_id
         aprovacoesPorAluno[id] = (aprovacoesPorAluno[id] ?? 0) + 1
       }
     }
     const vals = Object.values(aprovacoesPorAluno) as number[]
     const soma = vals.reduce((s, v) => s + Math.min(100, Math.round((v / totalAulasPublicadasN) * 100)), 0)
     mediaProgresso = Math.round(soma / idsAtivos.length)

     nuncaComecou = idsAtivos.filter((id: string) => !aprovacoesPorAluno[id]).length
     emAndamento = idsAtivos.filter((id: string) => {
       const n = aprovacoesPorAluno[id] ?? 0
       return n > 0 && n < totalAulasPublicadasN
     }).length
     concluiuMasNaoMarcado = idsAtivos.filter((id: string) =>
       (aprovacoesPorAluno[id] ?? 0) >= totalAulasPublicadasN
     ).length
   }
 }

 // Funil real: todos os alunos x progresso no Módulo 1
 // Busca Módulo 1 e suas aulas
 let aulasQ = (adminClient.from('aulas') as any)
   .select('id, modulo_id, modulo:modulos!inner(id, ordem, perfis_permitidos, publicado)')
   .eq('publicado', true)
   .eq('modulos.publicado', true)
 if (tid) aulasQ = aulasQ.eq('tenant_id', tid)
 const { data: aulasRaw } = await aulasQ
 const aulasMod1: string[] = []
 {
   const obrig = (aulasRaw ?? []).filter((a: any) => {
     const perfis = a.modulo?.perfis_permitidos ?? []
     return Array.isArray(perfis) && perfis.includes('consultor')
   })
   const mod1Ordem = Math.min(...obrig.map((a: any) => a.modulo?.ordem ?? 999))
   for (const a of obrig) {
     if ((a.modulo?.ordem ?? 999) === mod1Ordem) aulasMod1.push(a.id as string)
   }
 }

 // Todos os alunos com id para calcular o funil real
 const { data: todosAlunosRows } = await tq(adminClient.from('alunos').select('id'))
 const idsTodosGlobal = (todosAlunosRows ?? []).map((a: any) => a.id as string)

 let nuncaAbriu = 0
 let cursandoMod1 = 0
 let concluiuMod1 = 0
 {
   const CHUNK = 100
   const progPorAluno: Record<string, Set<string>> = {}
   const aulasMod1Set = new Set(aulasMod1)
   for (let i = 0; i < idsTodosGlobal.length; i += CHUNK) {
     const { data } = await adminClient.from('progresso')
       .select('aluno_id, aula_id')
       .eq('aprovado', true)
       .in('aluno_id', idsTodosGlobal.slice(i, i + CHUNK))
     for (const p of data ?? []) {
       if (!progPorAluno[p.aluno_id]) progPorAluno[p.aluno_id] = new Set()
       progPorAluno[p.aluno_id].add(p.aula_id)
     }
   }
   for (const id of idsTodosGlobal) {
     const aulasFeitoSet = progPorAluno[id]
     if (!aulasFeitoSet || aulasFeitoSet.size === 0) {
       nuncaAbriu++
     } else if (aulasMod1Set.size > 0 && aulasMod1.every(aid => aulasFeitoSet.has(aid))) {
       concluiuMod1++
     } else {
       cursandoMod1++
     }
   }
 }

 const periodo = searchParams?.periodo ?? 'mes_atual'
 const periodoInfo = calcularPeriodo(periodo, searchParams?.inicio, searchParams?.fim)

 const agora = new Date()
 const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1).toISOString()

 const [
   { count: novosNoPeriodo },
   { count: novosNoPrev },
   { data: cadastrosMensaisRaw },
 ] = await Promise.all([
   tq(adminClient.from('alunos').select('id', { count: 'exact', head: true }))
     .gte('created_at', periodoInfo.inicio.toISOString())
     .lte('created_at', periodoInfo.fim.toISOString()),
   tq(adminClient.from('alunos').select('id', { count: 'exact', head: true }))
     .gte('created_at', periodoInfo.inicioPrev.toISOString())
     .lte('created_at', periodoInfo.fimPrev.toISOString()),
   tq(adminClient.from('alunos').select('created_at')).gte('created_at', seisAtras),
 ])

 const mesesCadastro: Record<string, number> = {}
 for (const r of (cadastrosMensaisRaw ?? []) as { created_at: string }[]) {
   const d = new Date(r.created_at)
   const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
   mesesCadastro[key] = (mesesCadastro[key] ?? 0) + 1
 }
 const mesesLabels = Array.from({ length: 6 }, (_, i) => {
   const d = new Date(agora.getFullYear(), agora.getMonth() - 5 + i, 1)
   const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
   return { label: d.toLocaleDateString('pt-BR', { month: 'short' }), total: mesesCadastro[key] ?? 0, key }
 })

 const novosAlunos = novosNoPeriodo ?? 0

 // Últimos 8 alunos cadastrados
 const { data: ultimosAlunos } = await tq(
   adminClient.from('alunos').select('id, nome, email, status, created_at').order('created_at', { ascending: false }).limit(8)
 )

 const stats = [
   { label: 'Total Cadastrados', value: totalAlunos ?? 0, sub: `${alunosAtivos ?? 0} ativos`, cor: '#818cf8' },
   { label: 'Nunca abriu aula', value: nuncaAbriu, sub: `${totalAlunos ? Math.round(nuncaAbriu / (totalAlunos ?? 1) * 100) : 0}% do total`, cor: '#f87171' },
   { label: 'Cursando', value: cursandoMod1, sub: 'pelo menos 1 aula feita', cor: '#fbbf24' },
   { label: 'Concluiram Mod. 1', value: concluiuMod1, sub: 'todas as aulas do Módulo 1', cor: '#4ade80' },
   { label: 'PROs Ativos', value: gestoresAtivos ?? 0, sub: `de ${totalGestores ?? 0} cadastrados`, cor: '#38bdf8' },
   { label: 'Novos no Período', value: novosNoPeriodo ?? 0, sub: `Anterior: ${novosNoPrev ?? 0}`, cor: '#c084fc' },
 ]

 const atalhos = [
   { href: '/admin/alunos', label: 'Alunos', desc: 'Gerenciar cadastros' },
   { href: '/admin/sem-acesso', label: 'Sem acesso', desc: `${nuncaAbriu} nunca abriram aulas` },
   { href: '/admin/modulos', label: 'Módulos', desc: 'Organizar conteúdo' },
   { href: '/admin/aulas-ao-vivo', label: 'Aulas ao Vivo', desc: 'Agendar transmissões' },
   { href: '/admin/contratos', label: 'Contratos', desc: 'Contratos digitais' },
   { href: '/admin/crm', label: 'CRM', desc: 'Interações e notas' },
   { href: '/admin/gestores', label: 'Gestores PRO', desc: 'Planos ativos' },
   { href: '/admin/relatorio-conclusao', label: 'Relatório de Conclusão', desc: 'Diagnóstico completo' },
   { href: '/admin/funil-consultor', label: 'Funil Onboarding', desc: 'Quiz e perguntas do funil' },
 ]

 const statusCor: Record<string, string> = {
   ativo: '#4ade80',
   concluido: '#818cf8',
   inativo: '#f87171',
 }
 const statusLabel: Record<string, string> = {
   ativo: 'Ativo',
   concluido: 'Concluído',
   inativo: 'Inativo',
 }

 return (
   <>
     <div style={{ marginBottom: 24 }}>
       <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--avp-text)', letterSpacing: '-0.02em' }}>Dashboard</h1>
       <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
         Visão geral da plataforma <span style={{ color: '#818cf8', fontWeight: 600 }}>{periodoInfo.label}</span>
       </p>
     </div>

     {isMaster && <LinksTeste />}

     <DashboardFiltro periodoAtual={periodo} inicioAtual={searchParams?.inicio} fimAtual={searchParams?.fim} />

     {/* BI visual — gráfico de rosca + cards */}
     <DashboardBI
       totalAlunos={totalAlunos ?? 0}
       nuncaAbriu={nuncaAbriu}
       cursandoMod1={cursandoMod1}
       concluiuMod1={concluiuMod1}
       gestoresAtivos={gestoresAtivos ?? 0}
       totalGestores={totalGestores ?? 0}
       novosAlunos={novosAlunos ?? 0}
       alunosConcluidos={alunosConcluidos ?? 0}
     />

     <DashboardPeriodo meses={mesesLabels} />

     {/* Alerta: concluiram mas não marcados */}
     {concluiuMasNaoMarcado > 0 && (
       <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
         <div>
           <p style={{ fontWeight: 700, fontSize: 13, color: '#f97316', margin: '0 0 2px' }}>
             {concluiuMasNaoMarcado} aluno{concluiuMasNaoMarcado > 1 ? 's' : ''} completaram todas as aulas mas ainda não foram marcados como concluídos
           </p>
           <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>Use "Recalcular Conclusões" para corrigir automaticamente.</p>
         </div>
         <Link href="/admin/relatorio-conclusao" style={{ background: '#f97316', color: '#fff', padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
           Ver Relatório
         </Link>
       </div>
     )}

     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

       {/* Atalhos rápidos */}
       <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px' }}>
         <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', marginBottom: 14 }}>Acesso Rápido</p>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
           {atalhos.map(a => (
             <Link
               key={a.href}
               href={a.href}
               style={{ display: 'block', padding: '10px 12px', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, textDecoration: 'none', transition: 'background .15s' }}
             >
               <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text)', margin: '0 0 2px' }}>{a.label}</p>
               <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{a.desc}</p>
             </Link>
           ))}
         </div>
       </div>

       {/* Últimos cadastros */}
       <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
           <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', margin: 0 }}>Últimos Cadastros</p>
           <Link href="/admin/alunos" style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none' }}>Ver todos</Link>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
           {(ultimosAlunos ?? []).map((a: any) => {
             const data = new Date(a.created_at)
             const label = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
             const cor = statusCor[a.status] ?? '#94a3b8'
             return (
               <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(129,140,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8' }}>{(a.nome as string)?.[0]?.toUpperCase() ?? '?'}</span>
                 </div>
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</p>
                   <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{label}</p>
                 </div>
                 <span style={{ fontSize: 10, fontWeight: 700, color: cor, background: cor + '18', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                   {statusLabel[a.status] ?? a.status}
                 </span>
               </div>
             )
           })}
           {(ultimosAlunos ?? []).length === 0 && (
             <p style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>Nenhum aluno cadastrado ainda.</p>
           )}
         </div>
       </div>
     </div>
   </>
 )
}
