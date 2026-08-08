export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import LinksTeste from './LinksTeste'
import Link from 'next/link'

import { DOMINIO_MASTER } from '@/lib/constants'

export default async function AdminDashboard() {
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

 const seteAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
 const { count: novosAlunos } = await tq(adminClient.from('alunos').select('id', { count: 'exact', head: true })).gte('created_at', seteAtras)

 // Últimos 8 alunos cadastrados
 const { data: ultimosAlunos } = await tq(
   adminClient.from('alunos').select('id, nome, email, status, created_at').order('created_at', { ascending: false }).limit(8)
 )

 const stats = [
   { label: 'Total de Alunos', value: totalAlunos ?? 0, sub: `${alunosAtivos ?? 0} ativos`, cor: '#818cf8' },
   { label: 'Concluíram', value: alunosConcluidos ?? 0, sub: `${taxaConclusao}% de conclusão`, cor: '#4ade80' },
   { label: 'Progresso Médio', value: `${mediaProgresso}%`, sub: 'entre alunos ativos', cor: '#818cf8' },
   { label: 'Novos (7 dias)', value: novosAlunos ?? 0, sub: 'novos cadastros', cor: '#c084fc' },
   { label: 'PROs Ativos', value: gestoresAtivos ?? 0, sub: `de ${totalGestores ?? 0} cadastrados`, cor: '#38bdf8' },
   { label: 'Aulas Publicadas', value: aulasPublicadas ?? 0, sub: `de ${totalAulas ?? 0} criadas`, cor: '#38bdf8' },
 ]

 const atalhos = [
   { href: '/admin/alunos', label: 'Alunos', desc: 'Gerenciar cadastros' },
   { href: '/admin/modulos', label: 'Módulos', desc: 'Organizar conteúdo' },
   { href: '/admin/aulas-ao-vivo', label: 'Aulas ao Vivo', desc: 'Agendar transmissões' },
   { href: '/admin/contratos', label: 'Contratos', desc: 'Contratos digitais' },
   { href: '/admin/crm', label: 'CRM', desc: 'Interações e notas' },
   { href: '/admin/ranking', label: 'Ranking', desc: 'Desempenho dos alunos' },
   { href: '/admin/gestores', label: 'Gestores PRO', desc: 'Planos ativos' },
   { href: '/admin/relatorio-conclusao', label: 'Relatório de Conclusão', desc: 'Diagnóstico completo' },
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
       <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>Visão geral da plataforma</p>
     </div>

     {isMaster && <LinksTeste />}

     {/* Cards de métricas */}
     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
       {stats.map(s => (
         <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
           <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{s.label}</p>
           <p style={{ fontSize: 28, fontWeight: 700, color: s.cor, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{s.value}</p>
           <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{s.sub}</p>
         </div>
       ))}
     </div>

     {/* Funil visual dos ativos */}
     {(alunosAtivos ?? 0) > 0 && (
       <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
         <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', marginBottom: 14 }}>
           Funil — {alunosAtivos} alunos ativos
         </p>
         <div style={{ display: 'flex', gap: 0, height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
           <div style={{ flex: concluiuMasNaoMarcado, background: '#f97316' }} title="Completaram mas não marcados" />
           <div style={{ flex: emAndamento, background: '#fbbf24' }} title="Em andamento" />
           <div style={{ flex: nuncaComecou, background: '#f87171' }} title="Nunca começaram" />
         </div>
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 12 }}>
           <span style={{ color: '#f87171' }}>{nuncaComecou} nunca começaram</span>
           <span style={{ color: '#fbbf24' }}>{emAndamento} em andamento</span>
           <span style={{ color: '#f97316' }}>{concluiuMasNaoMarcado} completaram (pendente marcar)</span>
         </div>
       </div>
     )}

     {/* Alerta de ação */}
     {concluiuMasNaoMarcado > 0 && (
       <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
         <div>
           <p style={{ fontWeight: 700, fontSize: 13, color: '#f97316', margin: '0 0 2px' }}>
             {concluiuMasNaoMarcado} aluno{concluiuMasNaoMarcado > 1 ? 's' : ''} completaram todas as aulas mas ainda não foram marcados como concluídos
           </p>
           <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Use "Recalcular Conclusões" para corrigir automaticamente.</p>
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
               style={{ display: 'block', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, textDecoration: 'none', transition: 'background .15s' }}
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
