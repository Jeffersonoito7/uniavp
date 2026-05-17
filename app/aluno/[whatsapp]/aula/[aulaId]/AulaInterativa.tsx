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
}

export default function AulaInterativa({
  whatsapp, aulaId, youtubeId, videoUrl, titulo, bloquearAvancar,
  aulaAnterior, proximaAula, proximaStatus,
  questoes, aprovacaoMinima, jaAprovado, tentativasAnteriores, quizTipo,
  simNaoPergunta, simNaoNaoMensagem, simNaoPerguntas, temQuiz,
  linkExterno, linkExternoTitulo,
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
