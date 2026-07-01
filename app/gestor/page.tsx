export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import { headers } from 'next/headers'
import { getLimitePROGratuito } from '@/lib/pros-indicados'
import { getAppUrl } from '@/lib/get-app-url'
import GestorDashboard from './GestorDashboard'
import IndicadorPopup from '@/app/components/IndicadorPopup'
import CpfAlertPopup from '@/app/components/CpfAlertPopup'
import InactivityReload from '@/app/components/InactivityReload'

export default async function GestorPage({ searchParams }: { searchParams?: { preview?: string; wpp?: string } }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=pro')

 const adminClient = createServiceRoleClient()

 // Modo preview: admin (tenant ou super) visualiza painel PRO sem trocar de sessao
 const isPreview = searchParams?.preview === '1' && !!searchParams?.wpp
 let isAdminPreview = false
 if (isPreview) {
 const [{ data: adminRec }, { data: superRec }] = await Promise.all([
 adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 ])
 isAdminPreview = !!(adminRec || superRec)
 }

 const { data: gestor } = await (adminClient.from('gestores') as any)
 .select('id, nome, email, whatsapp, foto_perfil, status_assinatura, trial_expira_em, plano_vencimento, tenant_id, indicado_por_gestor_id, link_externo, cpf')
 .eq(isAdminPreview ? 'whatsapp' : 'user_id', isAdminPreview ? searchParams!.wpp! : user.id)
 .eq('ativo', true)
 .maybeSingle()
 if (!gestor) redirect(isAdminPreview ? '/admin/ver-pro' : '/entrar?p=pro')

 const gestorSemCpf = !(gestor as any).cpf

 // Se trial sem data de expiração → auto-concede 7 dias (bug da migration DEFAULT)
 if (!isAdminPreview && gestor.status_assinatura === 'trial' && !gestor.trial_expira_em) {
 const trialExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
 await adminClient.from('gestores')
 .update({ trial_expira_em: trialExpira })
 .eq('id', gestor.id)
 gestor.trial_expira_em = trialExpira
 }

 // Verifica acesso: trial ativo, plano ativo, ou plano ativo sem data (legado)
 const agora = new Date()
 const trialAtivo = gestor.status_assinatura === 'trial' && gestor.trial_expira_em && new Date(gestor.trial_expira_em)> agora
 const planoAtivo = gestor.status_assinatura === 'ativo' && (!gestor.plano_vencimento || new Date(gestor.plano_vencimento)> agora)
 if (!isAdminPreview && !trialAtivo && !planoAtivo) redirect('/gestor/assinar')

 const gestorFoto: string | null = gestor.foto_perfil ?? null

 // Normaliza variações de DDI: alunos antigos podem ter sido registrados
 // com ou sem o prefixo 55, enquanto o gestor pode ter whatsapp em formato diferente
 const wpp = gestor.whatsapp
 const wppSemDDI = wpp.startsWith('55') && wpp.length > 11 ? wpp.slice(2) : wpp
 const wppComDDI = wpp.startsWith('55') ? wpp : `55${wpp}`
 const variacoesWpp = [...new Set([wpp, wppSemDDI, wppComDDI])]

 const { data: consultores } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, email, status, created_at, ultimo_estudo_em, streak_atual')
 .in('gestor_whatsapp', variacoesWpp)
 .order('created_at', { ascending: false })

 const { count: totalAulas } = await adminClient.from('aulas')
 .select('*', { count: 'exact', head: true })
 .eq('publicado', true)

 const progressoMap: Record<string, number> = {}
 if ((consultores ?? []).length> 0) {
 const alunoIds = (consultores ?? []).map((c: any) => c.id)
 const { data: todosProgresso } = await adminClient.from('progresso')
 .select('aluno_id, aula_id')
 .in('aluno_id', alunoIds)
 .eq('aprovado', true)
 const contagem: Record<string, Set<string>> = {}
 for (const p of (todosProgresso ?? [])) {
 if (!contagem[p.aluno_id]) contagem[p.aluno_id] = new Set()
 contagem[p.aluno_id].add(p.aula_id)
 }
 for (const c of (consultores ?? [])) {
 const unique = contagem[c.id]?.size ?? 0
 progressoMap[c.id] = totalAulas ? Math.round((unique / totalAulas) * 100) : 0
 }
 }

 // Mapa de indicações: whatsapp do consultor → quantos indicou
 const indicacoesMap: Record<string, number> = {}
 if ((consultores ?? []).length> 0) {
 const whatsapps = (consultores ?? []).map((c: any) => c.whatsapp)
 const { data: indRows } = await adminClient.from('indicadores')
 .select('id, whatsapp')
 .eq('tipo', 'consultor')
 .in('whatsapp', whatsapps)
 if ((indRows ?? []).length> 0) {
 const indIds = (indRows ?? []).map((r: any) => r.id)
 const { data: alunosInd } = await adminClient.from('alunos')
 .select('indicador_id')
 .in('indicador_id', indIds)
 const wppById: Record<string, string> = {}
 for (const r of (indRows ?? [])) wppById[r.id] = r.whatsapp
 for (const a of (alunosInd ?? [])) {
 const wpp = a.indicador_id ? wppById[a.indicador_id] : undefined
 if (wpp) indicacoesMap[wpp] = (indicacoesMap[wpp] ?? 0) + 1
 }
 }
 }

 const { data: templatesRaw } = await adminClient.from('artes_templates')
 .select('*').order('created_at')
 const artesTemplates = (templatesRaw ?? []).filter((t: any) => !t.gestor_id || t.gestor_id === gestor.id)

 const host = (await headers()).get('host') ?? ''
 const siteConfig = await getSiteConfig(host)
 const baseUrl = siteConfig.dominioCustomizado
 ? `https://${siteConfig.dominioCustomizado}`
 : await getAppUrl(gestor.tenant_id)

 const { data: capaCfg } = await adminClient.from('configuracoes')
 .select('valor').eq('chave', 'modulo_capa_padrao').maybeSingle()
 const capaDefault = capaCfg?.valor ? String(capaCfg.valor).replace(/"/g, '') : null

 const { data: proCfgLink } = await adminClient.from('configuracoes')
 .select('valor').eq('chave', 'pro_pode_configurar_link').maybeSingle()
 const podeCfgLink = String(proCfgLink?.valor ?? '') === 'true'

 // Documentos para download disponíveis no painel PRO
 const { data: documentosPro } = await adminClient.from('documentos_painel')
 .select('id, titulo, descricao, pdf_url')
 .eq('ativo', true)
 .in('painel', ['pro', 'ambos'])
 .order('ordem', { ascending: true })

 // PROs ativos indicados por este gestor (para o benefício de PRO gratuito)
 const [{ count: prosIndicados }, limiteProGratuito] = await Promise.all([
 adminClient.from('gestores')
 .select('id', { count: 'exact', head: true })
 .eq('indicado_por_gestor_id', gestor.id)
 .eq('ativo', true)
 .eq('status_assinatura', 'ativo'),
 getLimitePROGratuito(adminClient, gestor.tenant_id),
 ])

 return (
 <>
 {!isAdminPreview && <InactivityReload />}
 {!isAdminPreview && gestorSemCpf && (
 <CpfAlertPopup tipo="gestor" />
 )}
 {!isAdminPreview && !gestor.indicado_por_gestor_id && (
 <IndicadorPopup entityId={gestor.id} entityWhatsapp={gestor.whatsapp} tipo="gestor" />
 )}
 {isAdminPreview && (
 <div style={{ background: '#f59e0b', color: '#000', padding: '8px 20px', fontSize: 13, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
 Modo Preview Admin: {gestor.nome} ({gestor.whatsapp})
 <a href="/admin/ver-pro" style={{ color: '#000', textDecoration: 'underline', fontWeight: 600 }}>Voltar ao admin</a>
 </div>
 )}
 <GestorDashboard
 gestor={{ ...gestor, foto_perfil: gestorFoto }}
 consultores={consultores ?? []}
 progressoMap={progressoMap}
 indicacoesMap={indicacoesMap}
 artesTemplatesIniciais={artesTemplates}
 baseUrl={baseUrl}
 capaDefault={capaDefault}
 prosIndicados={prosIndicados ?? 0}
 limiteProGratuito={limiteProGratuito}
 documentos={documentosPro ?? []}
 podeCfgLink={podeCfgLink}
 />
 </>
 )
}
