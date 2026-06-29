'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoPlayer from '@/app/components/VideoPlayer'
import NavegacaoAulas from './NavegacaoAulas'
import Quiz from './Quiz'
import CelebracaoModulo from '@/app/components/CelebracaoModulo'

type AulaNav = { id: string; titulo: string; ordem: number }
type Questao = { id: string; enunciado: string; alternativas: { texto: string; correta: boolean }[]; explicacao: string | null }
type SimNaoItem = { pergunta: string; nao_mensagem?: string }

type Props = {
 whatsapp: string
 aulaId: string
 moduloId: string
 youtubeId?: string | null
 videoUrl?: string | null
 titulo: string
 bloquearAvancar: boolean
 aulaAnterior: AulaNav | null
 proximaAula: AulaNav | null
 proximaStatus: string
 questoes: Questao[]
 aprovacaoMinima: number
 jaAprovado: boolean
 tentativasAnteriores: number
 quizTipo: 'obrigatorio' | 'indicativo' | 'sim_nao'
 simNaoPergunta?: string
 simNaoNaoMensagem?: string
 simNaoPerguntas?: SimNaoItem[]
 temQuiz: boolean
 linkExterno?: string | null
 linkExternoTitulo?: string
 bloquearLinkExterno?: boolean
 appIosUrl?: string | null
 appAndroidUrl?: string | null
 bloquearLinksApp?: boolean
 eUltimaAula: boolean
}

export default function AulaInterativa({
 whatsapp, aulaId, moduloId, youtubeId, videoUrl, titulo, bloquearAvancar,
 aulaAnterior, proximaAula, proximaStatus,
 questoes, aprovacaoMinima, jaAprovado, tentativasAnteriores, quizTipo,
 simNaoPergunta, simNaoNaoMensagem, simNaoPerguntas, temQuiz,
 linkExterno, linkExternoTitulo, bloquearLinkExterno,
 appIosUrl, appAndroidUrl, bloquearLinksApp,
 eUltimaAula,
}: Props) {
 const router = useRouter()
 const [videoTerminou, setVideoTerminou] = useState(false)
 const [mostrarCelebracao, setMostrarCelebracao] = useState(false)
 const [linkClicado, setLinkClicado] = useState(() => {
 try { return !!localStorage.getItem(`link_ext_${aulaId}`) } catch { return false }
 })
 const [appClicado, setAppClicado] = useState(() => {
 try { return !!localStorage.getItem(`app_clicado_${aulaId}`) } catch { return false }
 })

 const eUltimaAulaDoModulo = eUltimaAula
 // Bloqueios independentes: só bloqueia se a flag estiver ativa
 const exigeLink = !!linkExterno && !!bloquearLinkExterno
 const exigeApp = !!(appIosUrl || appAndroidUrl) && !!bloquearLinksApp
 const podeProsseguir = (!exigeLink || linkClicado) && (!exigeApp || appClicado)

 function dispararCelebracao() {
 if (eUltimaAulaDoModulo && podeProsseguir) {
 setMostrarCelebracao(true)
 } else {
 router.refresh()
 }
 }

 async function handleVideoEnd() {
 setVideoTerminou(true)
 if (!temQuiz && !jaAprovado) {
 // Aula sem quiz: salva progresso automaticamente no banco antes de liberar a próxima
 await fetch('/api/quiz', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aula_id: aulaId, pular: true }),
 })
 dispararCelebracao()
 } else if (jaAprovado) {
 dispararCelebracao()
 }
 // Se tem quiz pendente: videoTerminou = true já exibe o quiz automaticamente
 }

 function handleQuizAprovado() {
 // Quiz recém aprovado — agora sim verifica celebração
 dispararCelebracao()
 }

 function handlePrecisaReassistir() {
 setVideoTerminou(false)
 }

 function handleCelebracaoClose() {
 setMostrarCelebracao(false)
 // Limpa o "já visto" do certificado para garantir que ele apareça na listagem
 try { localStorage.removeItem(`cert_visto_modulo_${moduloId}_${whatsapp}`) } catch { /* */ }
 router.push(`/aluno/${whatsapp}`)
 }

 function handleLinkClick() {
 try { localStorage.setItem(`link_ext_${aulaId}`, '1') } catch { /* */ }
 setLinkClicado(true)
 if (eUltimaAulaDoModulo && (!exigeApp || appClicado)) setMostrarCelebracao(true)
 window.open(linkExterno!, '_blank')
 }

 function handleAppClick(url: string) {
 try { localStorage.setItem(`app_clicado_${aulaId}`, '1') } catch { /* */ }
 setAppClicado(true)
 if (eUltimaAulaDoModulo && (!exigeLink || linkClicado)) setMostrarCelebracao(true)
 window.open(url, '_blank')
 }

 return (
 <>
 {mostrarCelebracao && <CelebracaoModulo onClose={handleCelebracaoClose} />}

 {/* Vídeo */}
 <VideoPlayer
 youtubeId={youtubeId}
 videoUrl={videoUrl}
 titulo={titulo}
 onEnded={handleVideoEnd}
 bloquearAvancar={bloquearAvancar}
 />

 {/* Quiz — aparece só após o vídeo terminar */}
 {temQuiz && videoTerminou && (
 <div style={{ padding: '0 24px' }}>
 <Quiz
 aulaId={aulaId}
 questoes={questoes}
 aprovacaoMinima={aprovacaoMinima}
 jaAprovado={jaAprovado}
 tentativasAnteriores={tentativasAnteriores}
 quizTipo={quizTipo}
 simNaoPergunta={simNaoPergunta}
 simNaoNaoMensagem={simNaoNaoMensagem}
 simNaoPerguntas={simNaoPerguntas}
 onAprovado={handleQuizAprovado}
 onPrecisaReassistir={handlePrecisaReassistir}
 />
 </div>
 )}

 {/* Mensagem enquanto vídeo não terminou */}
 {temQuiz && !videoTerminou && (
 <div style={{ padding: '16px 24px' }}>
 <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--avp-text-dim)', fontSize: 14 }}>
 <span style={{ fontSize: 20 }}></span>
 <span>O quiz desta aula será liberado ao final do vídeo.</span>
 </div>
 </div>
 )}

 {/* Link externo — aparece após o vídeo (e quiz se houver) */}
 {!!linkExterno && videoTerminou && (!temQuiz || jaAprovado) && (
 <div style={{ padding: '0 24px 8px' }}>
 {!linkClicado ? (
 <div style={{ background: exigeLink ? 'rgba(79,70,229,0.06)' : 'var(--avp-card)', border: `${exigeLink ? '2px solid rgba(79,70,229,0.3)' : '1px solid var(--avp-border)'}`, borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
 <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--avp-text)' }}>
 {exigeLink ? 'Próximo passo obrigatório' : 'Plataforma parceira'}
 </p>
 {exigeLink && (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
 Para continuar para a próxima aula, você precisa acessar a plataforma parceira primeiro.
 </p>
 )}
 <button onClick={handleLinkClick}
 style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }}>
 {linkExternoTitulo || 'Cadastre-se na plataforma parceira'}
 </button>
 </div>
 ) : (
 <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
 <span style={{ fontSize: 20 }}></span>
 <p style={{ margin: 0, fontSize: 14, color: '#22c55e', fontWeight: 600 }}>Plataforma parceira acessada!</p>
 </div>
 )}
 </div>
 )}

 {/* Botões de download do app — aparecem após o vídeo */}
 {(appIosUrl || appAndroidUrl) && videoTerminou && (
 <div style={{ padding: '0 24px 8px' }}>
 <div style={{ background: exigeApp && !appClicado ? 'rgba(251,191,36,0.05)' : 'var(--avp-card)', border: `${exigeApp && !appClicado ? '2px solid rgba(251,191,36,0.35)' : '1px solid var(--avp-border)'}`, borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
 {appClicado ? (
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
 <span style={{ fontSize: 20 }}></span>
 <p style={{ margin: 0, fontSize: 14, color: '#22c55e', fontWeight: 600 }}>App acessado!</p>
 </div>
 ) : (
 <>
 <div style={{ fontSize: 32, marginBottom: 8 }}></div>
 <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
 {exigeApp ? 'Baixe o app — passo obrigatório' : 'Baixe o app consultor'}
 </p>
 {exigeApp && (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
 Para avançar para a próxima aula, baixe o app primeiro.
 </p>
 )}
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Disponível para iOS e Android</p>
 <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
 {appIosUrl && (
 <button onClick={() => handleAppClick(appIosUrl)}
 style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#000', color: '#fff', border: '1px solid #444', borderRadius: 12, padding: '10px 22px', minWidth: 170, justifyContent: 'center', cursor: 'pointer' }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
 <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
 <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.75, letterSpacing: 0.3 }}>Disponível na</div>
 <div style={{ fontSize: 15, fontWeight: 700 }}>App Store</div>
 </div>
 </button>
 )}
 {appAndroidUrl && (
 <button onClick={() => handleAppClick(appAndroidUrl)}
 style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#000', color: '#fff', border: '1px solid #444', borderRadius: 12, padding: '10px 22px', minWidth: 170, justifyContent: 'center', cursor: 'pointer' }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
 <path d="M3.18 23.76c.3.17.64.23.99.15l13.23-7.63-2.87-2.87L3.18 23.76z"/>
 <path d="M2.08 3.66C2.03 3.9 2 4.16 2 4.43v15.14c0 .27.03.53.08.77l.07.06 8.49-8.48v-.2L2.15 3.6l-.07.06z"/>
 <path d="M20.56 10.7l-2.29-1.32-3.21 3.21 3.21 3.21 2.3-1.33c.66-.38.66-1.38-.01-1.77z"/>
 <path d="M3.18.24L14.52 7.87l-2.87 2.86L3.18.31V.24z"/>
 </svg>
 <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
 <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.75, letterSpacing: 0.3 }}>Disponível no</div>
 <div style={{ fontSize: 15, fontWeight: 700 }}>Google Play</div>
 </div>
 </button>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* Navegação prev/next — bloqueada se link obrigatório não foi clicado */}
 <NavegacaoAulas
 whatsapp={whatsapp}
 aulaAnterior={aulaAnterior}
 proximaAula={podeProsseguir ? proximaAula : null}
 proximaStatus={podeProsseguir ? proximaStatus : 'bloqueada'}
 />
 </>
 )
}
