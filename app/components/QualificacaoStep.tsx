'use client'
import { useState } from 'react'

type Pergunta = {
  texto: string
  opcoes: { label: string; aprovado: boolean }[]
}

const PERGUNTAS: Pergunta[] = [
  {
    texto: 'Você gosta ou tem interesse em trabalhar com vendas?',
    opcoes: [
      { label: '✅ Sim, gosto de vendas e quero crescer nessa área', aprovado: true },
      { label: '❌ Não, vendas não é meu perfil', aprovado: false },
    ],
  },
  {
    texto: 'Você está disposto(a) a se dedicar a um treinamento online para se qualificar?',
    opcoes: [
      { label: '✅ Sim, estou pronto(a) para aprender', aprovado: true },
      { label: '❌ Não tenho disponibilidade agora', aprovado: false },
    ],
  },
]

interface Props {
  gestorNome?: string
  onAprovado: () => void
}

export default function QualificacaoStep({ gestorNome, onAprovado }: Props) {
  const [etapa, setEtapa] = useState<'intro' | 'perguntas' | 'reprovado'>('intro')
  const [perguntaIdx, setPerguntaIdx] = useState(0)
  const [selecionado, setSelecionado] = useState<number | null>(null)

  function responder(opcaoIdx: number) {
    const opcao = PERGUNTAS[perguntaIdx].opcoes[opcaoIdx]

    if (!opcao.aprovado) {
      setEtapa('reprovado')
      return
    }

    if (perguntaIdx + 1 < PERGUNTAS.length) {
      setPerguntaIdx(i => i + 1)
      setSelecionado(null)
    } else {
      onAprovado()
    }
  }

  // ── INTRO ──
  if (etapa === 'intro') {
    return (
      <div style={{ textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
          Antes de continuar,<br />precisamos te conhecer melhor
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
          {gestorNome
            ? `${gestorNome} está buscando pessoas com o perfil certo. Responda ${PERGUNTAS.length} pergunta${PERGUNTAS.length > 1 ? 's' : ''} rápida${PERGUNTAS.length > 1 ? 's' : ''} para ver se essa oportunidade é para você.`
            : `Responda ${PERGUNTAS.length} pergunta${PERGUNTAS.length > 1 ? 's' : ''} rápida${PERGUNTAS.length > 1 ? 's' : ''} para confirmar que essa oportunidade é para você.`
          }
        </p>
        <button onClick={() => setEtapa('perguntas')}
          style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>
          Começar →
        </button>
      </div>
    )
  }

  // ── REPROVADO ──
  if (etapa === 'reprovado') {
    return (
      <div style={{ textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🙏</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
          Obrigado pela honestidade!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.8, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
          Nossa plataforma é voltada para quem quer construir uma carreira em vendas e consultoria. No momento, este conteúdo não é o ideal para o seu perfil.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 20px', maxWidth: 380, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>
            Se mudar de ideia no futuro, estaremos aqui. Sucesso na sua jornada! 🚀
          </p>
        </div>
      </div>
    )
  }

  // ── PERGUNTAS ──
  const pergunta = PERGUNTAS[perguntaIdx]
  const progresso = Math.round(((perguntaIdx) / PERGUNTAS.length) * 100)

  return (
    <div style={{ padding: '0 8px' }}>
      {/* Progresso */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            Pergunta {perguntaIdx + 1} de {PERGUNTAS.length}
          </span>
          <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700 }}>{progresso}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 4 }}>
          <div style={{ width: `${progresso}%`, height: '100%', background: 'linear-gradient(90deg, #1e40af, #3b82f6)', borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Pergunta */}
      <h2 style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 24, lineHeight: 1.4 }}>
        {pergunta.texto}
      </h2>

      {/* Opções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pergunta.opcoes.map((opcao, i) => (
          <button
            key={i}
            onClick={() => { setSelecionado(i); setTimeout(() => responder(i), 300) }}
            style={{
              background: selecionado === i
                ? opcao.aprovado ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
                : 'rgba(255,255,255,0.06)',
              border: `2px solid ${selecionado === i
                ? opcao.aprovado ? '#22c55e' : '#ef4444'
                : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 12, padding: '16px 20px',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            {opcao.label}
          </button>
        ))}
      </div>
    </div>
  )
}
