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
}

export default function AulaInterativa({
  whatsapp, aulaId, youtubeId, videoUrl, titulo, bloquearAvancar,
  aulaAnterior, proximaAula, proximaStatus,
  questoes, aprovacaoMinima, jaAprovado, tentativasAnteriores, quizTipo,
  simNaoPergunta, simNaoNaoMensagem, simNaoPerguntas, temQuiz,
}: Props) {
  const router = useRouter()
  const [videoTerminou, setVideoTerminou] = useState(false)
  const [mostrarCelebracao, setMostrarCelebracao] = useState(false)
  const eUltimaAulaDoModulo = !proximaAula

  function handleVideoEnd() {
    setVideoTerminou(true)
    if (eUltimaAulaDoModulo) setMostrarCelebracao(true)
    router.refresh()
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

      {/* Navegação prev/next */}
      <NavegacaoAulas
        whatsapp={whatsapp}
        aulaAnterior={aulaAnterior}
        proximaAula={proximaAula}
        proximaStatus={proximaStatus}
      />
    </>
  )
}
