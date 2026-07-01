export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'
import Link from 'next/link'
import Comentarios from './Comentarios'
import CountdownAoVivo from './CountdownAoVivo'
import CurtidasButton from '@/app/components/CurtidasButton'
import ReacaoAula from './ReacaoAula'
import AvaliacaoAula from './AvaliacaoAula'
import AulaInterativa from './AulaInterativa'

export default async function AulaPage({ params }: { params: { whatsapp: string; aulaId: string } }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) redirect('/entrar?p=free')

 const adminClient = createServiceRoleClient()
 const { data: aluno } = await adminClient.from('alunos')
 .select('id, nome, whatsapp, especialista').eq('user_id', user.id).maybeSingle()
 if (!aluno) redirect('/entrar?p=free')
 if (aluno.whatsapp !== params.whatsapp) redirect(`/aluno/${aluno.whatsapp}`)

 const { data: aula } = await adminClient.from('aulas')
 .select('*, modulo:modulos(titulo)').eq('id', params.aulaId).maybeSingle()
 if (!aula || !aula.publicado) redirect(`/aluno/${params.whatsapp}`)

 // ── Verificação server-side: aula bloqueada? ──
 type TrilhaRow = { aula_id: string; modulo_id: string; status: string; aula_titulo: string; aula_ordem: number; capa_url: string | null; youtube_video_id: string }

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const { data: trilhaRaw } = await (adminClient as unknown as { rpc(fn: string, args: Record<string, unknown>): Promise<{ data: TrilhaRow[] | null }> })
 .rpc('obter_trilha_aluno', { p_aluno_id: aluno.id })
 const trilha = (trilhaRaw ?? []) as TrilhaRow[]
 const trilhaStatus = trilha.find(t => t.aula_id === params.aulaId)
 if (trilhaStatus?.status === 'bloqueada') redirect(`/aluno/${params.whatsapp}`)

 // ── Verifica se o aluno é também gestor (PRO) — precisa ser antes do check de módulo PRO ──
 const { data: gestorRowEarly } = await adminClient.from('gestores')
 .select('id').eq('user_id', user.id).eq('ativo', true).maybeSingle()
 const isPro = !!gestorRowEarly

 // ── Verificação de permissão do módulo (PRO exclusivo) ──
 const { data: moduloPerm } = await adminClient.from('modulos')
 .select('perfis_permitidos').eq('id', aula.modulo_id).maybeSingle()
 const perfisPermitidos: string[] = moduloPerm?.perfis_permitidos ?? ['consultor', 'gestor']
 const moduloApenasProPermissao = !perfisPermitidos.includes('consultor') && perfisPermitidos.includes('gestor')
 // Gestor PRO ativo tem acesso a módulos exclusivos — só redireciona quem não é PRO
 if (moduloApenasProPermissao && !isPro) redirect(`/upgrade`)

 // Trilha do módulo para sidebar
 const aulasModulo = trilha
 .filter(t => t.modulo_id === aula.modulo_id)
 .sort((a, b) => a.aula_ordem - b.aula_ordem)

 const idxAtual = aulasModulo.findIndex(a => a.aula_id === params.aulaId)
 const aulaAnteriorNav = idxAtual> 0
 ? { id: aulasModulo[idxAtual - 1].aula_id, titulo: aulasModulo[idxAtual - 1].aula_titulo, ordem: aulasModulo[idxAtual - 1].aula_ordem }
 : null
 const proximaAulaNav = idxAtual>= 0 && idxAtual < aulasModulo.length - 1
 ? { id: aulasModulo[idxAtual + 1].aula_id, titulo: aulasModulo[idxAtual + 1].aula_titulo, ordem: aulasModulo[idxAtual + 1].aula_ordem }
 : null
 const proximaStatus = proximaAulaNav ? (aulasModulo[idxAtual + 1]?.status ?? 'bloqueada') : 'nenhuma'

 // Determina se é realmente a última aula publicada do módulo (por ordem)
 const { data: ultimaAulaPublicada } = await adminClient.from('aulas')
 .select('id')
 .eq('modulo_id', aula.modulo_id)
 .eq('publicado', true)
 .order('ordem', { ascending: false })
 .limit(1)
 .maybeSingle()
 const eUltimaAula = ultimaAulaPublicada?.id === params.aulaId

 // Avaliação existente
 const { data: avaliacaoExistente } = await adminClient.from('aula_avaliacoes')
 .select('estrelas, sugestao').eq('aluno_id', aluno.id).eq('aula_id', params.aulaId).maybeSingle()

 // Curtidas
 const { count: totalCurtidas } = await adminClient.from('aula_curtidas')
 .select('*', { count: 'exact', head: true }).eq('aula_id', params.aulaId)
 const { data: minhaCurtida } = await adminClient.from('aula_curtidas')
 .select('id').eq('aula_id', params.aulaId).eq('aluno_id', aluno.id).maybeSingle()

 // Reação
 const { data: minhaReacao } = await adminClient.from('reacoes_aula')
 .select('id').eq('aula_id', params.aulaId).eq('aluno_id', aluno.id).maybeSingle()

 // Arquivos
 const { data: arquivos } = await adminClient.from('aula_arquivos')
 .select('*').eq('aula_id', params.aulaId).order('created_at')

 // Link externo: usa o do próprio aluno (se configurado) ou fallback pro link do PRO
 const { data: alunoCompleto } = await adminClient.from('alunos')
 .select('gestor_whatsapp, link_externo').eq('id', aluno.id).maybeSingle()
 let linkExternoPro: string | null = alunoCompleto?.link_externo ?? null
 if (!linkExternoPro && alunoCompleto?.gestor_whatsapp) {
 const { data: gestorLink } = await adminClient.from('gestores')
 .select('link_externo').eq('whatsapp', alunoCompleto.gestor_whatsapp).eq('ativo', true).maybeSingle()
 linkExternoPro = gestorLink?.link_externo ?? null
 }

 // Links do app consultor
 const { data: appCfgRows } = await adminClient.from('configuracoes')
 .select('chave, valor').in('chave', ['app_ios_url', 'app_android_url'])
 const appCfg: Record<string, string> = {}
 for (const r of appCfgRows ?? []) { try { appCfg[r.chave] = JSON.parse(String(r.valor)) } catch { appCfg[r.chave] = String(r.valor) } }
 const appIosUrl = appCfg['app_ios_url'] || null
 const appAndroidUrl = appCfg['app_android_url'] || null

 // Regras globais de aprendizado
 const { data: regrasRaw } = await adminClient.from('configuracoes')
 .select('chave, valor')
 .in('chave', ['free_quiz_obrigatorio', 'free_bloquear_video', 'pro_quiz_obrigatorio', 'pro_bloquear_video'])
 const regras: Record<string, string> = {}
 for (const r of regrasRaw ?? []) regras[r.chave] = String(r.valor)

 const isEspecialista = !!(aluno as any).especialista

 const quizObrigatorioGlobal = isPro
 ? regras['pro_quiz_obrigatorio'] !== 'false'
 : regras['free_quiz_obrigatorio'] !== 'false'
 const bloquearVideoGlobal = isPro
 ? regras['pro_bloquear_video'] !== 'false'
 : regras['free_bloquear_video'] !== 'false'

 // Especialista bypassa tudo. Aula-nível tem prioridade sobre global:
 // quiz_tipo definido na aula vence o global; bloquear_avancar=true sempre bloqueia,
 // bloquear_avancar=false/null só bloqueia se o global estiver ativo.
 const quizTipoEfetivo = isEspecialista
 ? ((aula.quiz_tipo ?? 'indicativo') as 'obrigatorio' | 'indicativo' | 'sim_nao')
 : aula.quiz_tipo === 'indicativo' || aula.quiz_tipo === 'sim_nao'
 ? (aula.quiz_tipo as 'obrigatorio' | 'indicativo' | 'sim_nao')
 : ((quizObrigatorioGlobal ? 'obrigatorio' : (aula.quiz_tipo ?? 'indicativo')) as 'obrigatorio' | 'indicativo' | 'sim_nao')
 // bloquear_avancar por aula tem prioridade; global só aplica se aula não tiver valor definido
 const bloquearAvancarEfetivo = isEspecialista ? false : aula.bloquear_avancar !== null ? !!aula.bloquear_avancar : bloquearVideoGlobal

 // Quiz
 const { data: questoesRaw } = await adminClient.from('questoes')
 .select('id, enunciado, alternativas, explicacao, ordem')
 .eq('aula_id', params.aulaId).eq('ativa', true).order('ordem')
 type QuestaoRow = { id: string; enunciado: string; alternativas: { texto: string; correta: boolean }[]; explicacao: string | null; ordem: number }
 const questoes = (questoesRaw ?? []) as QuestaoRow[]

 // Progresso do aluno nesta aula
 const { data: progressoRow } = await adminClient.from('progresso')
 .select('aprovado, tentativa_numero')
 .eq('aula_id', params.aulaId).eq('aluno_id', aluno.id)
 .eq('aprovado', true).limit(1).maybeSingle()
 const jaAprovado = !!progressoRow

 const { data: tentativas } = await adminClient.from('progresso')
 .select('tentativa_numero').eq('aula_id', params.aulaId).eq('aluno_id', aluno.id)
 .order('tentativa_numero', { ascending: false }).limit(1).maybeSingle()
 const tentativasAnteriores = tentativas?.tentativa_numero ?? 0

 const agora = new Date()
 const temAoVivo = aula.ao_vivo_link && aula.ao_vivo_data
 const aoVivoData = aula.ao_vivo_data ? new Date(aula.ao_vivo_data) : null
 const TRINTA_MIN = 30 * 60 * 1000
 const aoVivoPassou = aoVivoData && (agora.getTime() - aoVivoData.getTime())> TRINTA_MIN

 const iconeArquivo = (url: string) => {
 const ext = url.split('.').pop()?.toLowerCase()
 if (ext === 'pdf') return '📄'
 if (['ppt', 'pptx'].includes(ext ?? '')) return '📊'
 if (['doc', 'docx'].includes(ext ?? '')) return '📝'
 if (['xls', 'xlsx'].includes(ext ?? '')) return '📈'
 return '📎'
 }

 return (
 <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
 {/* Header */}
 <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
 <Link href={`/aluno/${params.whatsapp}`} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
 ← Módulos
 </Link>
 <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--avp-text)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aula.titulo}</span>
 <div />
 </header>

 {/* Layout dois painéis */}
 <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

 {/* ── PAINEL PRINCIPAL ── */}
 <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

 {/* Vídeo + Quiz + Navegação (client) */}
 {temAoVivo && (
 <div style={{ padding: '20px 24px' }}>
 <CountdownAoVivo aoVivoData={aula.ao_vivo_data ?? ''} aoVivoLink={aula.ao_vivo_link ?? ''} plataforma={aula.ao_vivo_plataforma ?? 'outro'} />
 </div>
 )}
 <AulaInterativa
 whatsapp={params.whatsapp}
 aulaId={params.aulaId}
 moduloId={aula.modulo_id}
 youtubeId={(!temAoVivo || aoVivoPassou) ? aula.youtube_video_id : null}
 videoUrl={(!temAoVivo || aoVivoPassou) ? aula.video_url : null}
 titulo={aula.titulo}
 bloquearAvancar={bloquearAvancarEfetivo}
 linkExterno={aula.mostrar_link_externo ? linkExternoPro : null}
 linkExternoTitulo={aula.link_externo_titulo || 'Cadastre-se na plataforma parceira'}
 bloquearLinkExterno={!!aula.bloquear_link_externo}
 appIosUrl={aula.mostrar_links_app ? appIosUrl : null}
 appAndroidUrl={aula.mostrar_links_app ? appAndroidUrl : null}
 bloquearLinksApp={!!aula.bloquear_links_app}
 aulaAnterior={aulaAnteriorNav}
 proximaAula={proximaAulaNav}
 proximaStatus={proximaStatus}
 eUltimaAula={eUltimaAula}
 questoes={questoes}
 aprovacaoMinima={aula.quiz_aprovacao_minima}
 jaAprovado={jaAprovado}
 tentativasAnteriores={tentativasAnteriores}
 quizTipo={quizTipoEfetivo}
 simNaoPergunta={aula.quiz_sim_nao_pergunta ?? ''}
 simNaoNaoMensagem={aula.quiz_sim_nao_nao_mensagem ?? ''}
 simNaoPerguntas={(aula.quiz_sim_nao_perguntas ?? []) as { pergunta: string; nao_mensagem: string }[]}
 temQuiz={questoes.length> 0 || aula.quiz_tipo === 'sim_nao'}
 />

 {/* Info + ações */}
 <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
 <div>
 <p style={{ fontSize: 12, color: 'var(--avp-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{aula.modulo?.titulo}</p>
 <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{aula.titulo}</h1>
 {aula.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>{aula.descricao}</p>}
 </div>
 <CurtidasButton aulaId={params.aulaId} alunoId={aluno.id} inicialCurtido={!!minhaCurtida} inicialTotal={totalCurtidas ?? 0} />
 </div>

 {/* Arquivos */}
 {(arquivos ?? []).length> 0 && (
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px' }}>
 <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Materiais</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
 {(arquivos ?? []).map((arq: { id: string; nome: string; url: string }) => (
 <a key={arq.id} href={arq.url} target="_blank" rel="noopener noreferrer"
 style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', color: 'var(--avp-text)', fontSize: 13 }}>
 <span style={{ fontSize: 18 }}>{iconeArquivo(arq.url)}</span>
 <span style={{ flex: 1 }}>{arq.nome}</span>
 <span style={{ fontSize: 11, color: 'var(--avp-green)', fontWeight: 700 }}>Baixar</span>
 </a>
 ))}
 </div>
 </div>
 )}

 {/* Avaliação por estrelas */}
 <AvaliacaoAula aulaId={params.aulaId} estrelasIniciais={avaliacaoExistente?.estrelas ?? null} sugestaoInicial={avaliacaoExistente?.sugestao ?? null} />

 <ReacaoAula aulaId={params.aulaId} alunoId={aluno.id} jaReagiu={!!minhaReacao} />
 <Comentarios aulaId={aula.id} alunoId={aluno.id} alunoNome={aluno.nome} />
 </div>
 </div>

 {/* ── SIDEBAR DE AULAS ── */}
 <div style={{ width: 320, borderLeft: '1px solid var(--avp-border)', overflowY: 'auto', background: 'var(--avp-card)', flexShrink: 0 }} className="hide-mobile">
 <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--avp-border)', position: 'sticky', top: 0, background: 'var(--avp-card)', zIndex: 1 }}>
 <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>Aulas</p>
 <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{aula.modulo?.titulo}</p>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column' }}>
 {aulasModulo.map((a, idx) => {
 const isAtual = a.aula_id === params.aulaId
 const isConcluida = a.status === 'concluida'
 const isBloqueada = a.status === 'bloqueada'
 const thumb = a.capa_url || (a.youtube_video_id ? `https://img.youtube.com/vi/${a.youtube_video_id}/mqdefault.jpg` : null)
 const item = (
 <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--avp-border)', background: isAtual ? 'rgba(59,130,246,0.1)' : 'transparent', borderLeft: isAtual ? '3px solid #3b82f6' : '3px solid transparent', opacity: isBloqueada ? 0.5 : 1, cursor: isBloqueada ? 'not-allowed' : 'pointer', transition: 'background 0.15s', alignItems: 'flex-start' }}>
 {/* Thumb */}
 <div style={{ width: 68, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1e3a8a' }}>
 {thumb && <img src={thumb} alt={a.aula_titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
 <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <div style={{ width: 22, height: 22, borderRadius: '50%', background: isConcluida ? '#22c55e' : isAtual ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isAtual ? '#1e40af' : '#fff' }}>
 {isConcluida ? '✓' : isBloqueada ? '🔒' : '▶'}
 </div>
 </div>
 </div>
 {/* Info */}
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 12, fontWeight: isAtual ? 700 : 500, color: isAtual ? '#fff' : 'var(--avp-text)', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
 {idx + 1}. {a.aula_titulo}
 </p>
 {isConcluida && <p style={{ fontSize: 10, color: '#22c55e', margin: '3px 0 0', fontWeight: 600 }}>Concluída</p>}
 {isAtual && !isConcluida && <p style={{ fontSize: 10, color: '#3b82f6', margin: '3px 0 0', fontWeight: 600 }}>Assistindo</p>}
 </div>
 </div>
 )
 return isBloqueada ? <div key={a.aula_id}>{item}</div> : (
 <Link key={a.aula_id} href={`/aluno/${params.whatsapp}/aula/${a.aula_id}`} style={{ textDecoration: 'none' }}>
 {item}
 </Link>
 )
 })}
 </div>
 </div>
 </div>
 </div>
 )
}
