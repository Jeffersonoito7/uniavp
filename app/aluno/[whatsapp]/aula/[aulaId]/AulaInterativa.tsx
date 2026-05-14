'use client'
import { useRouter } from 'next/navigation'
import VideoPlayer from '@/app/components/VideoPlayer'
import NavegacaoAulas from './NavegacaoAulas'
import Quiz from './Quiz'

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
  // Quiz props
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

  function atualizarTrilha() {
    router.refresh()
  }

  return (
    <>
      {/* Vídeo */}
      <VideoPlayer
        youtubeId={youtubeId}
        videoUrl={videoUrl}
        titulo={titulo}
        onEnded={atualizarTrilha}
        bloquearAvancar={bloquearAvancar}
      />

      {/* Quiz */}
      {temQuiz && (
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
            onAprovado={atualizarTrilha}
          />
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
