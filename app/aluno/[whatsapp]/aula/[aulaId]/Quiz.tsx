'use client'
import { useState } from 'react'

type Alternativa = { texto: string; correta: boolean }
type Questao = { id: string; enunciado: string; alternativas: Alternativa[]; explicacao: string | null }

type Props = {
  aulaId: string
  questoes: Questao[]
  aprovacaoMinima: number
  jaAprovado: boolean
  tentativasAnteriores: number
  quizTipo: 'obrigatorio' | 'indicativo' | 'sim_nao'
  simNaoPergunta?: string
  simNaoNaoMensagem?: string
}

export default function Quiz({ aulaId, questoes, aprovacaoMinima, jaAprovado, tentativasAnteriores, quizTipo, simNaoPergunta, simNaoNaoMensagem }: Props) {
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ acertos: number; total: number; percentual: number; aprovado: boolean; pulado?: boolean } | null>(null)
  const [iniciado, setIniciado] = useState(false)
  const [pendenteLiberacao, setPendenteLiberacao] = useState(false)
  const [modoLiberacao, setModoLiberacao] = useState('')
  const [simNaoRecusado, setSimNaoRecusado] = useState(false)

  // ── Quiz Sim/Não ──
  if (quizTipo === 'sim_nao') {
    if (jaAprovado) {
      return (
        <div style={{ background: '#02A15310', border: '1px solid var(--avp-green)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32 }}>✅</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--avp-green)', fontSize: 16, marginBottom: 4 }}>Compromisso assumido!</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Você já confirmou seu comprometimento nesta aula.</p>
          </div>
        </div>
      )
    }

    // Respondeu SIM — aprovado
    if (resultado?.aprovado) {
      return (
        <div style={{ background: '#02A15310', border: '1px solid var(--avp-green)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32 }}>🎯</span>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--avp-green)', fontSize: 16, marginBottom: 4 }}>Ótimo! Compromisso registrado.</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Sua resposta foi salva. A próxima aula está disponível!</p>
          </div>
        </div>
      )
    }

    // Respondeu NÃO — bloqueado
    if (simNaoRecusado) {
      const mensagemNao = simNaoNaoMensagem?.trim()
        || 'Quando estiver pronto para assumir esse compromisso, volte aqui e responda Sim para continuar.'
      return (
        <div style={{ background: '#e6394610', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🙏</div>
          <p style={{ fontWeight: 700, color: '#f87171', fontSize: 16, marginBottom: 10 }}>Obrigado pela honestidade!</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            {mensagemNao}
          </p>
          <button onClick={() => setSimNaoRecusado(false)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
            ← Voltar para a pergunta
          </button>
        </div>
      )
    }

    return (
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 28 }}>
        <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 12, lineHeight: 1.4 }}>
          ✋ {simNaoPergunta || 'Você se compromete a aplicar o que aprendeu nesta aula?'}
        </p>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 20 }}>
          Resposta obrigatória para continuar para a próxima aula.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => pular()} disabled={enviando}
            style={{ flex: 1, background: '#02A15320', border: '2px solid var(--avp-green)', color: 'var(--avp-green)', borderRadius: 10, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', opacity: enviando ? 0.7 : 1, fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {enviando ? '...' : '✅ Sim'}
          </button>
          <button onClick={() => setSimNaoRecusado(true)} disabled={enviando}
            style={{ flex: 1, background: '#e6394615', border: '2px solid var(--avp-danger)', color: 'var(--avp-danger)', borderRadius: 10, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            ❌ Não
          </button>
        </div>
      </div>
    )
  }

  if (questoes.length === 0) return null

  const letraAlt = (i: number) => ['A', 'B', 'C', 'D', 'E', 'F'][i]
  const todasRespondidas = questoes.every(q => respostas[q.id] !== undefined)

  async function pular() {
    setEnviando(true)
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aula_id: aulaId, pular: true }),
    })
    const data = await res.json()
    setResultado({ acertos: 0, total: questoes.length, percentual: 0, aprovado: true, pulado: true })
    setEnviando(false)
  }

  async function enviar() {
    if (!todasRespondidas) return
    setEnviando(true)
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aula_id: aulaId, respostas }),
    })
    const data = await res.json()
    if (data.pendente_liberacao) {
      setPendenteLiberacao(true)
      setModoLiberacao(data.modo)
    }
    setResultado({ acertos: data.acertos, total: data.total, percentual: data.percentual, aprovado: data.aprovado })
    setEnviando(false)
  }

  // Já aprovado anteriormente
  if (jaAprovado) {
    return (
      <div style={{ background: '#02A15310', border: '1px solid var(--avp-green)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 32 }}>🏆</span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--avp-green)', fontSize: 16, marginBottom: 4 }}>Quiz concluído com aprovação!</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Você já foi aprovado nesta aula. Continue para a próxima!</p>
        </div>
      </div>
    )
  }

  // Quiz pulado (indicativo)
  if (resultado?.pulado) {
    return (
      <div style={{ background: '#02A15310', border: '1px solid var(--avp-green)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 32 }}>🙏</span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--avp-green)', fontSize: 16, marginBottom: 4 }}>Tudo bem!</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Você pode continuar para a próxima aula. O quiz ficou registrado como não realizado.</p>
        </div>
      </div>
    )
  }

  // Resultado após envio
  if (resultado) {
    const cor = resultado.aprovado ? 'var(--avp-green)' : 'var(--avp-danger)'
    const bg = resultado.aprovado ? '#02A15315' : '#e6394615'
    const borda = resultado.aprovado ? 'var(--avp-green)' : 'var(--avp-danger)'
    return (
      <div style={{ background: bg, border: `1px solid ${borda}`, borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 48 }}>{resultado.aprovado ? '🎉' : '😔'}</span>
        <div>
          <p style={{ fontSize: 28, fontWeight: 900, color: cor, marginBottom: 4 }}>{resultado.percentual}%</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: cor, marginBottom: 8 }}>
            {resultado.aprovado ? 'Aprovado!' : 'Reprovado'}
          </p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>
            {resultado.acertos} de {resultado.total} questões corretas · Mínimo exigido: {aprovacaoMinima}%
          </p>
        </div>
        {resultado.aprovado && !pendenteLiberacao && (
          <div style={{ background: '#02A15320', borderRadius: 8, padding: '12px 20px' }}>
            <p style={{ color: 'var(--avp-green)', fontSize: 14, fontWeight: 600 }}>
              ✅ +10 pontos ganhos! A próxima aula será liberada em breve.
            </p>
          </div>
        )}
        {resultado.aprovado && pendenteLiberacao && (
          <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b50', borderRadius: 8, padding: '16px 20px' }}>
            <p style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⏳ Aguardando liberação</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>
              Você foi aprovado! A próxima aula será liberada pelo {modoLiberacao === 'manual_gestor' ? 'seu gestor' : 'administrador'}. Você receberá uma notificação.
            </p>
          </div>
        )}
        {!resultado.aprovado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Revise o conteúdo do vídeo e tente novamente.</p>
            <button onClick={() => { setResultado(null); setRespostas({}); setIniciado(false) }}
              style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    )
  }

  // Tela inicial (antes de iniciar)
  if (!iniciado) {
    return (
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 40 }}>📝</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Quiz desta aula</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 4 }}>
            {questoes.length} pergunta{questoes.length !== 1 ? 's' : ''} · Aprovação mínima: <strong style={{ color: 'var(--avp-text)' }}>{aprovacaoMinima}%</strong>
          </p>
          {tentativasAnteriores > 0 && (
            <p style={{ color: '#f59e0b', fontSize: 13 }}>Você já tentou {tentativasAnteriores} vez{tentativasAnteriores !== 1 ? 'es' : ''}.</p>
          )}
        </div>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, maxWidth: 400 }}>
          Responda todas as perguntas abaixo. Se for aprovado, a próxima aula será liberada automaticamente.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setIniciado(true)}
            style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            Iniciar quiz
          </button>
          {quizTipo === 'indicativo' && (
            <button onClick={pular} disabled={enviando}
              style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: '4px 8px' }}>
              {enviando ? 'Aguarde...' : 'Não, obrigado — pular quiz'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Quiz em andamento
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>📝 Quiz</h2>
        <span style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>{Object.keys(respostas).length}/{questoes.length} respondidas</span>
      </div>

      {questoes.map((q, qi) => {
        const respondida = respostas[q.id] !== undefined
        return (
          <div key={q.id} style={{ background: 'var(--avp-card)', border: `1px solid ${respondida ? 'var(--avp-green)' : 'var(--avp-border)'}`, borderRadius: 12, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{qi + 1}. {q.enunciado}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.alternativas.map((alt, ai) => {
                const selecionada = respostas[q.id] === ai
                return (
                  <button key={ai} type="button"
                    onClick={() => setRespostas(prev => ({ ...prev, [q.id]: ai }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: selecionada ? '#33368720' : 'var(--avp-black)',
                      border: `2px solid ${selecionada ? 'var(--avp-blue)' : 'var(--avp-border)'}`,
                      borderRadius: 8, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                      background: selecionada ? 'var(--avp-blue)' : 'var(--avp-border)',
                      color: selecionada ? '#fff' : 'var(--avp-text-dim)',
                    }}>{letraAlt(ai)}</span>
                    <span style={{ fontSize: 14, color: selecionada ? 'var(--avp-text)' : 'var(--avp-text-dim)', fontWeight: selecionada ? 600 : 400 }}>{alt.texto}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <button onClick={enviar} disabled={!todasRespondidas || enviando}
        style={{
          background: todasRespondidas ? 'var(--grad-brand)' : 'var(--avp-border)',
          color: todasRespondidas ? '#fff' : 'var(--avp-text-dim)',
          border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 16, cursor: todasRespondidas ? 'pointer' : 'not-allowed',
          opacity: enviando ? 0.7 : 1,
        }}>
        {enviando ? 'Corrigindo...' : todasRespondidas ? '✅ Enviar respostas' : `Responda todas as ${questoes.length} perguntas para enviar`}
      </button>
    </div>
  )
}
