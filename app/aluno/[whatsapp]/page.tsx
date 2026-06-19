import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'
import Link from 'next/link'
import CertificadoWrapper from '@/app/components/CertificadoWrapper'
import CarteiraAutoShow from '@/app/components/CarteiraAutoShow'
import SupportChat from '@/app/components/SupportChat'
import RankingWidget from '@/app/components/RankingWidget'
import RetomarPopup from '@/app/components/RetomarPopup'
import IndicacaoCard from '@/app/components/IndicacaoCard'
import IndicadorPopup from '@/app/components/IndicadorPopup'
import InactivityReload from '@/app/components/InactivityReload'
import ProTeaser from '@/app/components/ProTeaser'
import SetupInicial from '@/app/components/SetupInicial'
import CpfAlertPopup from '@/app/components/CpfAlertPopup'
import AlunoHeader from './AlunoHeader'
import AlunoStats from './AlunoStats'
import ModulosGrid from './ModulosGrid'
import LinkParceiroCard from './LinkParceiroCard'
import AulasDoModulo from './AulasDoModulo'
import type { TrilhaItem, ModuloComAulas } from './types'

function calcularNivel(pontos: number) {
 if (pontos>= 300) return { nome: 'Especialista', prox: null, atual: pontos, min: 300, max: 300 }
 if (pontos>= 100) return { nome: 'FREE Avançado', prox: 300, atual: pontos, min: 100, max: 300 }
 return { nome: 'Iniciante', prox: 100, atual: pontos, min: 0, max: 100 }
}

export default async function AlunoHomePage({ params, searchParams }: { params: { whatsapp: string }; searchParams?: { modulo?: string; preview?: string } }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=free')

 const adminClient = createServiceRoleClient()
 const hdrs = await headers()
 const host = hdrs.get('host') || ''
 const siteConfig = await getSiteConfig(host)
 const baseUrl = siteConfig.dominioCustomizado ? `https://${siteConfig.dominioCustomizado}` : `https://${host}`

 // Modo preview: admin (tenant ou super) pode visualizar painel de qualquer aluno sem trocar de sessao
 const isPreview = searchParams?.preview === '1'
 let isAdminPreview = false
 if (isPreview) {
 const [{ data: adminRecord }, { data: superRecord }] = await Promise.all([
 adminClient.from('admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 adminClient.from('super_admins').select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle(),
 ])
 isAdminPreview = !!(adminRecord || superRecord)
 }

 const { data: aluno } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, email, cpf, status, numero_registro, streak_atual, maior_streak, tenant_id, setup_concluido, gestor_whatsapp, indicador_id, link_externo')
 .eq(isAdminPreview ? 'whatsapp' : 'user_id', isAdminPreview ? params.whatsapp : user.id)
 .maybeSingle()

 const tid = aluno?.tenant_id as string | null
 const tq = (q: any) => tid ? q.eq('tenant_id', tid) : q

 const { data: certConfigs } = await tq(adminClient.from('configuracoes')
 .select('chave, valor'))
 .in('chave', [
 'certificado_template_url', 'certificado_nome_y', 'certificado_nome_tamanho', 'certificado_nome_cor',
 'modulo_capa_padrao',
 'cert_logo_esquerda', 'cert_logo_direita', 'cert_logo_y', 'cert_logo_tam',
 'cert_assinatura_y', 'cert_assinatura_ativa', 'cert_assinatura_url', 'cert_assinatura_nome', 'cert_assinatura_cargo',
 'carteira_logo_esquerda', 'carteira_logo_direita',
 'carteira_assinatura_url', 'carteira_assinatura_nome', 'carteira_assinatura_cargo',
 'contrato_habilitado', 'contrato_momento', 'carteira_quando', 'carteira_percentual_minimo',
 'passos_painel_habilitado',
 'captacao_mostrar_parceiro', 'captacao_bloquear_parceiro', 'captacao_parceiro_titulo',
 'captacao_link_externo', 'free_pode_configurar_link',
 'captacao_mostrar_app', 'captacao_bloquear_app',
 'app_ios_url', 'app_android_url',
 ])
 const certMap: Record<string, string> = {}
 for (const r of certConfigs ?? []) { try { certMap[r.chave] = JSON.parse(r.valor) } catch { certMap[r.chave] = r.valor } }
 const contratoHabilitado = certMap['contrato_habilitado'] === 'true'
 const contratoMomento = certMap['contrato_momento'] || 'desativado'
 const carteiraQuando = certMap['carteira_quando'] || 'concluido'
 const carteiraPercentualMinimo = parseInt(certMap['carteira_percentual_minimo'] || '50') || 50
 const passosPainelHabilitado = certMap['passos_painel_habilitado'] === 'true'
 const freePodeCfgLink = certMap['free_pode_configurar_link'] !== 'false'
 const setupMostrarParceiro = certMap['captacao_mostrar_parceiro'] === 'true'
 const setupBloquearParceiro = certMap['captacao_bloquear_parceiro'] === 'true'
 const setupParceiroTitulo = certMap['captacao_parceiro_titulo'] || undefined
 const setupMostrarApp = certMap['captacao_mostrar_app'] === 'true'
 const setupBloquearApp = certMap['captacao_bloquear_app'] === 'true'
 const setupAppIos = certMap['app_ios_url'] || undefined
 const setupAppAndroid = certMap['app_android_url'] || undefined

 if (!aluno) redirect(isAdminPreview ? '/admin/ver-free' : '/entrar?p=free')
 if (!isAdminPreview && aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

 // Verifica se o aluno já assinou o contrato (necessário para lógica de bloqueio)
 const { data: contratoAssinado } = contratoMomento !== 'desativado'
 ? await adminClient.from('contratos').select('numero_registro').eq('whatsapp', aluno.whatsapp).maybeSingle()
 : { data: null }

 // Bloqueia acesso se contrato_momento = 'no_cadastro' e ainda não assinou
 if (contratoMomento === 'no_cadastro' && !contratoAssinado) {
 const qs = new URLSearchParams({
 nome: aluno.nome,
 whatsapp: aluno.whatsapp,
 email: aluno.email ?? '',
 cpf: aluno.cpf ?? '',
 aluno_id: aluno.id,
 })
 redirect(`/contrato?${qs.toString()}`)
 }

 // Resolve link parceiro: próprio aluno → PRO do aluno → FREE que indicou → global admin
 const { data: gestorLink } = !aluno.link_externo && aluno.gestor_whatsapp
 ? await adminClient.from('gestores').select('link_externo').eq('whatsapp', aluno.gestor_whatsapp).maybeSingle()
 : { data: null }

 const { data: indicadorRow } = !aluno.link_externo && !gestorLink?.link_externo && aluno.indicador_id
 ? await adminClient.from('indicadores').select('whatsapp').eq('id', aluno.indicador_id).maybeSingle()
 : { data: null }

 const { data: indicadorAluno } = indicadorRow?.whatsapp
 ? await adminClient.from('alunos').select('link_externo').eq('whatsapp', indicadorRow.whatsapp).maybeSingle()
 : { data: null }

 const setupLinkParceiro = aluno.link_externo || gestorLink?.link_externo || indicadorAluno?.link_externo || certMap['captacao_link_externo'] || undefined

 const { data: gestorAtivo } = await adminClient.from('gestores')
 .select('id')
 .eq('user_id', user.id)
 .eq('ativo', true)
 .maybeSingle()
 if (gestorAtivo && !isAdminPreview) redirect('/pro')

 const { data: limiteRow } = await adminClient.from('configuracoes')
 .select('valor').eq('chave', 'free_max_modulos').maybeSingle()
 let freeMaxModulos = 0
 try { freeMaxModulos = parseInt(JSON.parse(String(limiteRow?.valor ?? '0'))) || 0 } catch { freeMaxModulos = 0 }

 const { data: trilhaRaw } = await adminClient.rpc('obter_trilha_aluno', { p_aluno_id: aluno.id })
 const trilhaBase: TrilhaItem[] = (trilhaRaw ?? []) as TrilhaItem[]

 const aulaIds = trilhaBase.map(t => t.aula_id)
 const { data: aulasConfig } = aulaIds.length> 0
 ? await adminClient.from('aulas').select('id, quiz_aprovacao_minima').in('id', aulaIds)
 : { data: [] }
 const aprovMinMap: Record<string, number> = {}
 for (const a of (aulasConfig ?? [])) aprovMinMap[a.id] = a.quiz_aprovacao_minima

 const trilha: TrilhaItem[] = trilhaBase.map(t => ({ ...t, quiz_aprovacao_minima: aprovMinMap[t.aula_id] ?? null }))

 const moduloIds = [...new Set(trilhaBase.map(t => t.modulo_id))]
 const { data: modulosConfig } = moduloIds.length> 0
 ? await adminClient.from('modulos')
 .select('id, perfis_permitidos, cert_ativo, cert_template_url, cert_nome_y, cert_nome_tamanho, cert_nome_cor, cert_nome_estilo, cert_logo_esq_url, cert_logo_dir_url, cert_logo_y, cert_logo_tam, cert_assinatura_url, cert_assinatura_nome, cert_assinatura_cargo, cert_assinatura_y')
 .in('id', moduloIds)
 : { data: [] }
 const moduloPermissoes: Record<string, string[]> = {}
 const moduloCerts: Record<string, any> = {}
 const certGlobalUrl = certMap['certificado_template_url'] ?? null
 for (const m of (modulosConfig ?? [])) {
 moduloPermissoes[m.id] = m.perfis_permitidos ?? ['consultor', 'gestor']
 if (m.cert_ativo && m.cert_template_url) {
 moduloCerts[m.id] = m
 } else if (certGlobalUrl) {
 moduloCerts[m.id] = {
 ...m,
 cert_template_url: certGlobalUrl,
 cert_nome_y: m.cert_nome_y ?? certMap['certificado_nome_y'],
 cert_nome_tamanho: m.cert_nome_tamanho ?? certMap['certificado_nome_tamanho'],
 cert_nome_cor: m.cert_nome_cor ?? certMap['certificado_nome_cor'],
 }
 }
 }

 const agrupado: Record<string, ModuloComAulas> = {}
 for (const item of trilha) {
 if (!agrupado[item.modulo_id]) {
 const perfis = moduloPermissoes[item.modulo_id] ?? ['consultor', 'gestor']
 const apenasProPermissao = !perfis.includes('consultor') && perfis.includes('gestor')
 agrupado[item.modulo_id] = { modulo_id: item.modulo_id, modulo_titulo: item.modulo_titulo, modulo_ordem: item.modulo_ordem, aulas: [], apenasProPermissao }
 }
 agrupado[item.modulo_id].aulas.push(item)
 }
 const modulosOrdenados = Object.values(agrupado).sort((a, b) => a.modulo_ordem - b.modulo_ordem)
 const modulos = modulosOrdenados.map((mod, idx) => {
 if (freeMaxModulos> 0 && idx>= freeMaxModulos) return { ...mod, apenasProPermissao: true }
 return mod
 })
 const moduloSelecionadoId = searchParams?.modulo
 const moduloAtivo = moduloSelecionadoId ? modulos.find(m => m.modulo_id === moduloSelecionadoId) ?? null : null

 const { data: pontosRows } = await adminClient.from('aluno_pontos').select('quantidade').eq('aluno_id', aluno.id)
 const totalPontos = (pontosRows ?? []).reduce((s: number, r: { quantidade: number }) => s + r.quantidade, 0)

 const { data: medalhasRows } = await adminClient.from('aluno_medalhas')
 .select('medalha:medalhas_config(nome, icone)')
 .eq('aluno_id', aluno.id)
 const medalhas = (medalhasRows ?? []).map((r: any) => r.medalha)

 const { data: meuIndicador } = await adminClient.from('indicadores')
 .select('id')
 .eq('whatsapp', aluno.whatsapp)
 .eq('tipo', 'consultor')
 .maybeSingle()
 const [{ count: totalIndicadosReal }, { data: ultimosIndicadosRows }] = await Promise.all([
 meuIndicador
 ? adminClient.from('alunos').select('id', { count: 'exact', head: true }).eq('indicador_id', meuIndicador.id)
 : Promise.resolve({ count: 0, data: null, error: null }),
 meuIndicador
 ? adminClient.from('alunos').select('nome, created_at').eq('indicador_id', meuIndicador.id).order('created_at', { ascending: false }).limit(5)
 : Promise.resolve({ data: null, count: null, error: null }),
 ])
 const ultimosIndicados = (ultimosIndicadosRows ?? []).map((r: { nome: string; created_at: string | null }) => ({ nome: r.nome, criado_em: r.created_at ?? '' }))

 const nivel = calcularNivel(totalPontos)
 const progressoPct = nivel.prox ? Math.round(((nivel.atual - nivel.min) / (nivel.max - nivel.min)) * 100) : 100

 const { data: documentosFree } = await adminClient.from('documentos_painel')
 .select('id, titulo, descricao, pdf_url')
 .eq('ativo', true)
 .in('painel', ['free', 'ambos'])
 .order('ordem', { ascending: true })

 const totalAulas = trilha.length
 const aulasConcluidas = trilha.filter(a => a.status === 'concluida').length
 const progressoGeral = totalAulas> 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0

 const aulaAtual = trilha
 .slice()
 .sort((a, b) => a.modulo_ordem !== b.modulo_ordem ? a.modulo_ordem - b.modulo_ordem : a.aula_ordem - b.aula_ordem)
 .find(a => a.status === 'disponivel')

 const mostrarCarteira =
 carteiraQuando === 'sempre' ||
 (carteiraQuando === 'percentual' && progressoGeral>= carteiraPercentualMinimo) ||
 (carteiraQuando === 'concluido' && aluno.status === 'concluido')

 const precisaSetup = passosPainelHabilitado && !aluno.setup_concluido &&
 (setupMostrarParceiro || (setupMostrarApp && (setupAppIos || setupAppAndroid)))

 // Bloqueia acesso se contrato_momento = 'ao_concluir' e curso concluído mas contrato não assinado
 if (contratoMomento === 'ao_concluir' && progressoGeral === 100 && !contratoAssinado) {
 const qs = new URLSearchParams({
 nome: aluno.nome,
 whatsapp: aluno.whatsapp,
 email: aluno.email ?? '',
 cpf: aluno.cpf ?? '',
 aluno_id: aluno.id,
 })
 redirect(`/contrato?${qs.toString()}`)
 }

 // Aulas ao vivo: admin (gestor_id null) + gestor do aluno
 let gestorIdAluno: string | null = null
 if (aluno.gestor_whatsapp) {
 const { data: gestorRow } = await adminClient.from('gestores').select('id').eq('whatsapp', aluno.gestor_whatsapp).maybeSingle()
 gestorIdAluno = gestorRow?.id ?? null
 }
 const { data: aulasVivo } = await adminClient
 .from('aulas_ao_vivo')
 .select('id, titulo, descricao, plataforma, link, data_hora, duracao_minutos, obrigatoria, gravacao_url')
 .or(gestorIdAluno ? `gestor_id.is.null,gestor_id.eq.${gestorIdAluno}` : 'gestor_id.is.null')
 .gte('data_hora', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
 .order('data_hora')
 .limit(5)

 return (
 <>
 {!aluno.cpf && !isAdminPreview && (
 <CpfAlertPopup tipo="aluno" alunoId={aluno.id} />
 )}
 {precisaSetup && (
 <SetupInicial
 whatsapp={aluno.whatsapp}
 mostrarParceiro={setupMostrarParceiro}
 bloquearParceiro={setupBloquearParceiro}
 parceiroTitulo={setupParceiroTitulo}
 linkParceiro={setupLinkParceiro}
 mostrarApp={setupMostrarApp}
 bloquearApp={setupBloquearApp}
 appIosUrl={setupAppIos}
 appAndroidUrl={setupAppAndroid}
 />
 )}
 <InactivityReload />
 <SupportChat painel="Consultor" />
 {!aluno.indicador_id && !aluno.gestor_whatsapp && !isAdminPreview && (
 <IndicadorPopup entityId={aluno.id} entityWhatsapp={aluno.whatsapp} tipo="aluno" />
 )}
 {aulaAtual && !moduloSelecionadoId && (
 <RetomarPopup
 whatsapp={aluno.whatsapp}
 aulaId={aulaAtual.aula_id}
 aulaId_titulo={aulaAtual.aula_titulo}
 moduloTitulo={aulaAtual.modulo_titulo}
 descricao={aulaAtual.aula_descricao}
 thumbUrl={aulaAtual.capa_url || (aulaAtual.youtube_video_id ? `https://img.youtube.com/vi/${aulaAtual.youtube_video_id}/mqdefault.jpg` : null)}
 totalModulos={modulos.length}
 totalAulas={trilha.length}
 />
 )}
 {isAdminPreview && (
 <div style={{ background: '#f59e0b', color: '#000', padding: '8px 20px', fontSize: 13, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
 Modo Preview Admin: {aluno.nome} ({aluno.whatsapp})
 <a href="/admin/ver-free" style={{ color: '#000', textDecoration: 'underline', fontWeight: 600 }}>Voltar ao admin</a>
 </div>
 )}
 <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>

 <AlunoHeader whatsapp={params.whatsapp} aluno={aluno} siteConfig={siteConfig} />

 <div style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px) 60px' }}>

 {/* ── HERO SAUDAÇÃO ── */}
 <div style={{ marginBottom: aulaAtual ? 20 : 28 }}>
 <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
 Olá, <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{aluno.nome.split(' ')[0]}</span>! 
 </h1>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>
 Bem-vindo à {siteConfig.nome}.
 </p>
 </div>

 {/* ── PRÓXIMA AULA ── */}
 {aulaAtual && (
 <div style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(79,70,229,0.04) 100%)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 24px rgba(79,70,229,0.12), inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '16px 16px 0 0' }} />
 <div style={{ minWidth: 0 }}>
 <p style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5 }}>Continuar de onde parou</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600, marginBottom: 3 }}>{aulaAtual.modulo_titulo}</p>
 <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--avp-text)', margin: 0, lineHeight: 1.2 }}>{aulaAtual.aula_titulo}</p>
 {aulaAtual.duracao_minutos && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 4 }}>{aulaAtual.duracao_minutos} min</p>}
 </div>
 <Link href={`/aluno/${params.whatsapp}/aula/${aulaAtual.aula_id}`}
 className="btn btn-primary"
 style={{ flexShrink: 0, textDecoration: 'none', whiteSpace: 'nowrap', borderRadius: 10, background: 'linear-gradient(135deg, #4338ca, #4f46e5)', boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>
 Continuar agora
 </Link>
 </div>
 )}

 {/* ── STATS ── */}
 <AlunoStats
 whatsapp={params.whatsapp}
 nivel={nivel}
 totalPontos={totalPontos}
 progressoPct={progressoPct}
 progressoGeral={progressoGeral}
 aulasConcluidas={aulasConcluidas}
 totalAulas={totalAulas}
 streakAtual={aluno.streak_atual}
 maiorStreak={aluno.maior_streak}
 medalhas={medalhas}
 mostrarCarteira={mostrarCarteira}
 />

 {/* ── LINK PARCEIRO ── */}
 <LinkParceiroCard alunoId={aluno.id} linkAtual={aluno.link_externo ?? null} />

 {/* ── AULAS AO VIVO ── */}
 {(aulasVivo ?? []).length> 0 && (
 <div style={{ marginBottom: 28 }}>
 <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Aulas ao Vivo</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {(aulasVivo ?? []).map((aula: any) => {
 const cor = aula.plataforma === 'zoom' ? '#2D8CFF' : '#34A853'
 const encerrada = new Date(aula.data_hora) < new Date()
 const dataHora = new Date(aula.data_hora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
 return (
 <div key={aula.id} style={{ background: 'var(--avp-card)', border: `1px solid ${encerrada ? 'var(--avp-border)' : cor}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', opacity: encerrada ? 0.65 : 1 }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
 <span style={{ background: cor, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{aula.plataforma === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
 {aula.obrigatoria && <span style={{ background: '#ef444420', color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Obrigatória</span>}
 {encerrada && aula.gravacao_url && <span style={{ background: '#8b5cf620', color: '#8b5cf6', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>Gravação disponível</span>}
 </div>
 <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 2px' }}>{aula.titulo}</p>
 {aula.descricao && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '0 0 4px' }}>{aula.descricao}</p>}
 <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{dataHora} · {aula.duracao_minutos} min</p>
 </div>
 <div>
 {!encerrada ? (
 <a href={aula.link} target="_blank" rel="noopener noreferrer"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: cor, color: '#fff', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
 Entrar na aula
 </a>
 ) : aula.gravacao_url ? (
 <a href={aula.gravacao_url} target="_blank" rel="noopener noreferrer"
 style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#8b5cf6', color: '#fff', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
 Ver gravação
 </a>
 ) : null}
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* ── BANNER DE FORMAÇÃO / CARTEIRA ── */}
 {mostrarCarteira && (
 <div style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
 <div style={{ flex: 1 }}>
 <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--avp-text)', margin: '0 0 4px' }}>Parabéns, {aluno.nome.split(' ')[0]}! Você concluiu a formação UNIAVP FREE!</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, margin: 0 }}>Você concluiu 100% da formação. Acesse seus documentos abaixo.</p>
 </div>
 <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
 <Link href={`/aluno/${params.whatsapp}/carteira`}
 style={{ background: '#fbbf24', color: '#1a1a1a', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
 Carteira
 </Link>
 {contratoHabilitado && (
 <Link href={`/contrato?nome=${encodeURIComponent(aluno.nome)}&whatsapp=${aluno.whatsapp}&email=${encodeURIComponent(aluno.email ?? '')}&cpf=${encodeURIComponent(aluno.cpf ?? '')}&aluno_id=${aluno.id}`}
 className="btn btn-primary"
 style={{ textDecoration: 'none', borderRadius: 10 }}>
 Assinar Contrato
 </Link>
 )}
 </div>
 </div>
 )}

 {/* ── CONTRATO DE REPRESENTAÇÃO ── */}
 {!moduloAtivo && contratoHabilitado && (
 <Link
 href={`/contrato?nome=${encodeURIComponent(aluno.nome)}&whatsapp=${aluno.whatsapp}&email=${encodeURIComponent(aluno.email ?? '')}&cpf=${encodeURIComponent(aluno.cpf ?? '')}&aluno_id=${aluno.id}`}
 style={{ display: 'block', textDecoration: 'none', marginBottom: 20 }}>
 <div style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.25)', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
 <div style={{ width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,70,229,0.12)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.2)' }}>
 <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
 </div>
 <div style={{ flex: 1 }}>
 <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--avp-text)', margin: '0 0 2px' }}>Contrato de Representação</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Assine o contrato digital de licenciamento com validade jurídica</p>
 </div>
 <div className="btn btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Assinar →</div>
 </div>
 </Link>
 )}


 {/* ── DOCUMENTOS PARA DOWNLOAD ── */}
 {!moduloAtivo && documentosFree && documentosFree.length> 0 && (
 <div style={{ marginBottom: 20 }}>
 <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--avp-text)', marginBottom: 12 }}>Documentos</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {documentosFree.map((doc: any) => (
 <a key={doc.id} href={doc.pdf_url} target="_blank" rel="noreferrer"
 style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '14px 18px', textDecoration: 'none' }}>
 <div style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,70,229,0.08)', borderRadius: 8, border: '1px solid rgba(79,70,229,0.15)' }}>
 <svg width="18" height="18" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--avp-text)', margin: 0 }}>{doc.titulo}</p>
 {doc.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.descricao}</p>}
 </div>
 <span style={{ background: 'rgba(79,70,229,0.1)', color: '#818cf8', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Baixar</span>
 </a>
 ))}
 </div>
 </div>
 )}

 {/* ── BIBLIOTECA DO PODER ── */}
 {!moduloAtivo && (
 <a href={`/aluno/${params.whatsapp}/biblioteca`} style={{ display: 'block', textDecoration: 'none', marginBottom: 20 }}>
 <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.14) 0%, rgba(124,58,237,0.08) 60%, rgba(15,15,30,0.6) 100%)', border: '1px solid rgba(79,70,229,0.35)', borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', boxShadow: '0 4px 28px rgba(79,70,229,0.14), inset 0 1px 0 rgba(255,255,255,0.06)', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', overflow: 'hidden' }}>
 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #818cf8)' }} />
 <div style={{ width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.2))', borderRadius: 12, border: '1px solid rgba(79,70,229,0.35)', fontSize: 22, boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}>
 📚
 </div>
 <div style={{ flex: 1 }}>
 <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--avp-text)', margin: '0 0 3px', letterSpacing: '-0.2px' }}>Biblioteca do Poder</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>Audiobooks e podcasts selecionados para acelerar sua evolução</p>
 </div>
 <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.25), rgba(79,70,229,0.15))', border: '1px solid rgba(129,140,248,0.4)', borderRadius: 10, padding: '9px 18px', color: '#c7d2fe', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
 Acessar →
 </div>
 </div>
 </a>
 )}

 {/* ── INDICAÇÃO — só aparece após o aluno ser formado ── */}
 {!moduloAtivo && aluno.status === 'concluido' && (
 <IndicacaoCard
 link={`${baseUrl}/c/${aluno.whatsapp}`}
 totalIndicados={totalIndicadosReal ?? 0}
 ultimosIndicados={ultimosIndicados}
 />
 )}

 {/* ── PRO TEASER ── */}
 {!moduloAtivo && (
 <ProTeaser totalIndicados={totalIndicadosReal ?? 0} />
 )}

 {/* ── MÓDULOS ── */}
 {!moduloAtivo && (
 <ModulosGrid
 modulos={modulos}
 whatsapp={params.whatsapp}
 capaDefault={certMap['modulo_capa_padrao'] || null}
 />
 )}

 {/* ── AULAS DO MÓDULO ── */}
 {moduloAtivo && (
 <AulasDoModulo moduloAtivo={moduloAtivo} whatsapp={params.whatsapp} />
 )}

 </div>
 </div>

 <RankingWidget meuId={aluno.id} />

 {/* Certificados por módulo */}
 {Object.entries(moduloCerts).map(([moduloId, cert]) => {
 const mod = modulos.find(m => m.modulo_id === moduloId)
 if (!mod) return null
 const todasConcluidas = mod.aulas.length> 0 && mod.aulas.every(a => a.status === 'concluida')
 if (!todasConcluidas) return null
 return (
 <CertificadoWrapper
 key={moduloId}
 nomeAluno={aluno.nome}
 templateUrl={cert.cert_template_url}
 chaveStorage={`modulo_${moduloId}_${aluno.whatsapp}`}
 semCarteira
 nomeY={cert.cert_nome_y ?? undefined}
 nomeFontePct={cert.cert_nome_tamanho ? cert.cert_nome_tamanho / 100 : undefined}
 nomeCor={cert.cert_nome_cor ?? undefined}
 nomeEstilo={cert.cert_nome_estilo ?? undefined}
 logoEsquerdaUrl={cert.cert_logo_esq_url ?? null}
 logoDireitaUrl={cert.cert_logo_dir_url ?? null}
 logoY={cert.cert_logo_y ?? undefined}
 logoTamPct={cert.cert_logo_tam ? cert.cert_logo_tam / 100 : undefined}
 assinaturaUrl={cert.cert_assinatura_url ?? null}
 assinaturaNome={cert.cert_assinatura_nome ?? undefined}
 assinaturaCargo={cert.cert_assinatura_cargo ?? undefined}
 assinaturaY={cert.cert_assinatura_y ?? undefined}
 />
 )
 })}

 {/* Carteirinha */}
 {aluno.status === 'concluido' && (
 <CarteiraAutoShow
 nomeAluno={aluno.nome}
 numRegistro={String(aluno.numero_registro ?? 1001).padStart(6, '0')}
 whatsapp={aluno.whatsapp}
 />
 )}
 </>
 )
}
