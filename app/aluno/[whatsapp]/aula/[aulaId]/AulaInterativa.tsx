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
  appIosUrl?: string | null
  appAndroidUrl?: string | null
}

export default function AulaInterativa({
  whatsapp, aulaId, youtubeId, videoUrl, titulo, bloquearAvancar,
  aulaAnterior, proximaAula, proximaStatus,
  questoes, aprovacaoMinima, jaAprovado, tentativasAnteriores, quizTipo,
  simNaoPergunta, simNaoNaoMensagem, simNaoPerguntas, temQuiz,
  linkExterno, linkExternoTitulo,
  appIosUrl, appAndroidUrl,
}: Props) {
  const router = useRouter()
  const [videoTerminou, setVideoTerminou] = useState(false)
  const [mostrarCelebracao, setMostrarCelebracao] = useState(false)
  const [linkClicado, setLinkClicado] = useState(() => {
    try { return !!localStorage.getItem(`link_ext_${aulaId}`) } catch { return false }
  })
  const eUltimaAulaDoModulo = !proximaAula
  const exigeLink = !!linkExterno
  const podeProsseguir = !exigeLink || linkClicado

  function handleVideoEnd() {
    setVideoTerminou(true)
    if (eUltimaAulaDoModulo && podeProsseguir) setMostrarCelebracao(true)
    router.refresh()
  }

  function handleLinkClick() {
    try { localStorage.setItem(`link_ext_${aulaId}`, '1') } catch { /* */ }
    setLinkClicado(true)
    if (eUltimaAulaDoModulo) setMostrarCelebracao(true)
    window.open(linkExterno!, '_blank')
  }

  return (
    <>
      {mostrarCelebracao && <CelebracaoModulo onClose={() => setMostrarCelebracao(false)} />}

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
            onAprovado={handleVideoEnd}
          />
        </div>
      )}

      {/* Mensagem enquanto vídeo não terminou */}
      {temQuiz && !videoTerminou && (
        <div style={{ padding: '16px 24px' }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--avp-text-dim)', fontSize: 14 }}>
            <span style={{ fontSize: 20 }}>📝</span>
            <span>O quiz desta aula será liberado ao final do vídeo.</span>
          </div>
        </div>
      )}

      {/* Link externo obrigatório — aparece após o vídeo (e quiz se houver) */}
      {exigeLink && videoTerminou && (!temQuiz || jaAprovado) && (
        <div style={{ padding: '0 24px 8px' }}>
          {!linkClicado ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.4)', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔗</div>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: 'var(--avp-text)' }}>Próximo passo obrigatório</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
                Para continuar para a próxima aula, você precisa acessar a plataforma parceira primeiro.
              </p>
              <button onClick={handleLinkClick}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', width: '100%' }}>
                👉 {linkExternoTitulo || 'Cadastre-se na plataforma parceira'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <p style={{ margin: 0, fontSize: 14, color: '#22c55e', fontWeight: 600 }}>Plataforma parceira acessada! Pode avançar.</p>
            </div>
          )}
        </div>
      )}

      {/* Botões de download do app — aparecem após o vídeo */}
      {(appIosUrl || appAndroidUrl) && videoTerminou && (
        <div style={{ padding: '0 24px 8px' }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
            <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Baixe o app consultor</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Disponível para iOS e Android</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {appIosUrl && (
                <a href={appIosUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#000', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, minWidth: 160, justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store (iOS)
                </a>
              )}
              {appAndroidUrl && (
                <a href={appAndroidUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#01875f', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 14, minWidth: 160, justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341L5.82 2.003A1 1 0 005 3v18a1 1 0 001.606.795l1.42-1.065 9.497-5.389zM5 19.197V4.803l10.092 11.42L5 19.197zM18.8 8.93l-2.022-1.147-1.434 1.621 1.434 1.621L18.8 9.89a.5.5 0 000-.96z"/></svg>
                  Google Play (Android)
                </a>
              )}
            </div>
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
