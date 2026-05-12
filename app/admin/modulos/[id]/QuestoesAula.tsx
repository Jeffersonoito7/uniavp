'use client'
import { useState, useEffect } from 'react'

type Alternativa = { texto: string; correta: boolean }
type Questao = { id: string; enunciado: string; alternativas: Alternativa[]; explicacao: string | null; ordem: number }
type QuizTipo = 'obrigatorio' | 'indicativo' | 'sim_nao'
type SimNaoItem = { pergunta: string; nao_mensagem: string }

const ALT_VAZIAS: Alternativa[] = [
  { texto: '', correta: true },
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
]

const TIPOS: { id: QuizTipo; label: string; desc: string }[] = [
  { id: 'obrigatorio',  label: '🔒 Quiz obrigatório', desc: 'Aluno deve passar no quiz para avançar' },
  { id: 'indicativo',   label: '💡 Quiz indicativo',  desc: 'Aluno pode pular — serve como indicador' },
  { id: 'sim_nao',      label: '✋ Sim ou Não',       desc: 'Perguntas obrigatórias — aluno deve responder Sim em todas para continuar' },
]

export default function QuestoesAula({
  aulaId,
  aprovacaoMinima,
  quizTipoInicial = 'obrigatorio',
  quizSimNaoPerguntaInicial = '',
  quizSimNaoNaoMensagemInicial = '',
  quizSimNaoPerguntasInicial,
}: {
  aulaId: string
  aprovacaoMinima: number
  quizTipoInicial?: QuizTipo
  quizSimNaoPerguntaInicial?: string
  quizSimNaoNaoMensagemInicial?: string
  quizSimNaoPerguntasInicial?: SimNaoItem[]
}) {
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [carregado, setCarregado] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  // Configuração do tipo de quiz
  const [quizTipo, setQuizTipo] = useState<QuizTipo>(quizTipoInicial)
  const [simNaoPerguntas, setSimNaoPerguntas] = useState<SimNaoItem[]>(() => {
    if (quizSimNaoPerguntasInicial?.length) return quizSimNaoPerguntasInicial
    if (quizSimNaoPerguntaInicial) return [{ pergunta: quizSimNaoPerguntaInicial, nao_mensagem: quizSimNaoNaoMensagemInicial ?? '' }]
    return []
  })
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [msgConfig, setMsgConfig] = useState('')

  // Form nova questão
  const [enunciado, setEnunciado] = useState('')
  const [alts, setAlts] = useState<Alternativa[]>(ALT_VAZIAS.map(a => ({ ...a })))
  const [explicacao, setExplicacao] = useState('')

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  async function carregar() {
    if (carregado) return
    const res = await fetch(`/api/admin/questoes?aula_id=${aulaId}`)
    const data = await res.json()
    const qs = data.questoes ?? []
    setQuestoes(qs)
    setCarregado(true)
    if (qs.length === 0 && quizTipo !== 'sim_nao') setAberto(true)
  }

  async function toggle() {
    if (!aberto) { await carregar(); setAberto(true) }
    else setAberto(false)
  }

  async function salvarConfig(novoTipo: QuizTipo, perguntas?: SimNaoItem[]) {
    const lista = perguntas ?? simNaoPerguntas
    setSalvandoConfig(true)
    const res = await fetch('/api/admin/aulas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: aulaId,
        quiz_tipo: novoTipo,
        quiz_sim_nao_perguntas: lista,
        quiz_sim_nao_pergunta: lista[0]?.pergunta ?? null,
        quiz_sim_nao_nao_mensagem: lista[0]?.nao_mensagem ?? null,
      }),
    })
    if (res.ok) { setMsgConfig('Salvo!'); setTimeout(() => setMsgConfig(''), 2000) }
    else setMsgConfig('Erro ao salvar.')
    setSalvandoConfig(false)
  }

  function mudarTipo(tipo: QuizTipo) {
    setQuizTipo(tipo)
    salvarConfig(tipo)
  }

  function adicionarPergunta() {
    setSimNaoPerguntas(prev => [...prev, { pergunta: '', nao_mensagem: '' }])
  }

  function removerPergunta(idx: number) {
    setSimNaoPerguntas(prev => prev.filter((_, i) => i !== idx))
  }

  function atualizarPergunta(idx: number, campo: keyof SimNaoItem, valor: string) {
    setSimNaoPerguntas(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p))
  }

  useEffect(() => { carregar() }, [])

  function setCorreta(idx: number) { setAlts(prev => prev.map((a, i) => ({ ...a, correta: i === idx }))) }
  function setTextoAlt(idx: number, texto: string) { setAlts(prev => prev.map((a, i) => i === idx ? { ...a, texto } : a)) }
  function addAlternativa() { if (alts.length < 6) setAlts(prev => [...prev, { texto: '', correta: false }]) }
  function removeAlternativa(idx: number) {
    if (alts.length <= 2) return
    const novas = alts.filter((_, i) => i !== idx)
    if (!novas.some(a => a.correta)) novas[0].correta = true
    setAlts(novas)
  }
  function resetForm() { setEnunciado(''); setAlts(ALT_VAZIAS.map(a => ({ ...a }))); setExplicacao(''); setEditandoId(null); setAdicionando(false) }
  function abrirEdicao(q: Questao) { setEnunciado(q.enunciado); setAlts(q.alternativas.map(a => ({ ...a }))); setExplicacao(q.explicacao ?? ''); setEditandoId(q.id); setAdicionando(true) }

  async function salvar() {
    if (!enunciado.trim()) { setMsg('Preencha o enunciado.'); return }
    if (alts.some(a => !a.texto.trim())) { setMsg('Preencha todas as alternativas.'); return }
    if (!alts.some(a => a.correta)) { setMsg('Marque a alternativa correta.'); return }
    setSalvando(true); setMsg('')
    const body = { aula_id: aulaId, enunciado, alternativas: alts, explicacao: explicacao || null }
    if (editandoId) {
      const res = await fetch('/api/admin/questoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editandoId, ...body }) })
      const data = await res.json()
      if (data.questao) { setQuestoes(prev => prev.map(q => q.id === editandoId ? data.questao : q)); setMsg('Questão atualizada!'); resetForm() }
      else setMsg(data.error ?? 'Erro ao salvar.')
    } else {
      const res = await fetch('/api/admin/questoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.questao) { setQuestoes(prev => [...prev, data.questao]); setMsg('Questão adicionada!'); resetForm() }
      else setMsg(data.error ?? 'Erro ao salvar.')
    }
    setSalvando(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta questão?')) return
    await fetch('/api/admin/questoes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setQuestoes(prev => prev.filter(q => q.id !== id))
  }

  const letraAlt = (i: number) => ['A', 'B', 'C', 'D', 'E', 'F'][i]
  const semQuestoes = carregado && questoes.length === 0 && quizTipo !== 'sim_nao'
  const tipoAtual = TIPOS.find(t => t.id === quizTipo)
  const podeSalvarSimNao = simNaoPerguntas.length > 0 && simNaoPerguntas.every(p => p.pergunta.trim())

  return (
    <div style={{ marginTop: 14 }}>
      {semQuestoes && !aberto && (
        <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b50', borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b', marginBottom: 2 }}>Quiz sem perguntas</p>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Esta aula não tem questões. O aluno não conseguirá concluí-la.</p>
          </div>
        </div>
      )}

      <button type="button" onClick={toggle}
        style={{
          background: semQuestoes ? '#f59e0b20' : '#02A15315',
          border: `1px solid ${semQuestoes ? '#f59e0b60' : '#02A15350'}`,
          borderRadius: 8, padding: '8px 16px',
          color: semQuestoes ? '#f59e0b' : 'var(--avp-green)',
          fontSize: 13, cursor: 'pointer', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        }}>
        <span>{semQuestoes ? '⚠️' : tipoAtual?.id === 'sim_nao' ? '✋' : '📝'}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>
          {semQuestoes
            ? 'Clique aqui para configurar o quiz'
            : quizTipo === 'sim_nao'
              ? `Sim ou Não · ${simNaoPerguntas.length} pergunta${simNaoPerguntas.length !== 1 ? 's' : ''} configurada${simNaoPerguntas.length !== 1 ? 's' : ''}`
              : `Quiz: ${questoes.length} questão${questoes.length !== 1 ? 'ões' : ''} · Aprovação mínima: ${aprovacaoMinima}%`
          }
        </span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{aberto ? '▲ fechar' : '▼ abrir'}</span>
      </button>

      {aberto && (
        <div style={{ marginTop: 12, background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Seletor de tipo ── */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tipo de quiz</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TIPOS.map(tipo => (
                <label key={tipo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, border: `1px solid ${quizTipo === tipo.id ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: quizTipo === tipo.id ? '#02A15315' : 'var(--avp-card)', transition: 'all 0.15s' }}>
                  <input type="radio" checked={quizTipo === tipo.id} onChange={() => mudarTipo(tipo.id)} style={{ marginTop: 2, accentColor: 'var(--avp-green)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text)', margin: 0 }}>{tipo.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{tipo.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {msgConfig && <p style={{ fontSize: 11, color: 'var(--avp-green)', marginTop: 6 }}>{msgConfig}</p>}
          </div>

          {/* ── Sim ou Não: lista de perguntas ── */}
          {quizTipo === 'sim_nao' && (
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Perguntas Sim/Não</p>
                <button type="button" onClick={adicionarPergunta}
                  style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  + Adicionar pergunta
                </button>
              </div>

              {simNaoPerguntas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 10 }}>Nenhuma pergunta ainda.</p>
                  <button type="button" onClick={adicionarPergunta}
                    style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    + Adicionar primeira pergunta
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {simNaoPerguntas.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)' }}>
                        {simNaoPerguntas.length > 1 ? `Pergunta ${idx + 1} de ${simNaoPerguntas.length}` : 'Pergunta'}
                      </p>
                      <button type="button" onClick={() => removerPergunta(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                    <textarea
                      value={item.pergunta}
                      onChange={e => atualizarPergunta(idx, 'pergunta', e.target.value)}
                      placeholder="Ex: Você se compromete a aplicar o que aprendeu nesta aula?"
                      style={{ ...inp, minHeight: 56, resize: 'vertical', marginBottom: 8 }}
                    />
                    <textarea
                      value={item.nao_mensagem}
                      onChange={e => atualizarPergunta(idx, 'nao_mensagem', e.target.value)}
                      placeholder="Mensagem se responder Não (opcional) — Ex: Tudo bem! Volte quando estiver pronto."
                      style={{ ...inp, minHeight: 52, resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>

              {simNaoPerguntas.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: '#02A15320', border: '1px solid var(--avp-green)', borderRadius: 8, padding: '8px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--avp-green)' }}>✅ Sim → avança</div>
                    <div style={{ flex: 1, background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '8px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--avp-danger)' }}>❌ Não → bloqueia</div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
                    O aluno responde uma por vez. Precisa responder Sim em {simNaoPerguntas.length > 1 ? 'todas' : 'ela'} para avançar.
                  </p>
                  <button type="button" onClick={() => salvarConfig(quizTipo)} disabled={salvandoConfig || !podeSalvarSimNao}
                    style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: (salvandoConfig || !podeSalvarSimNao) ? 0.6 : 1 }}>
                    {salvandoConfig ? 'Salvando...' : '✓ Salvar perguntas'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Questões normais (obrigatório / indicativo) ── */}
          {quizTipo !== 'sim_nao' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>QUESTÕES DO QUIZ</p>
                {!adicionando && (
                  <button type="button" onClick={() => setAdicionando(true)}
                    style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    + Adicionar questão
                  </button>
                )}
              </div>

              {questoes.map((q, qi) => (
                <div key={q.id} style={{ background: 'var(--avp-card)', borderRadius: 8, padding: 14, border: '1px solid var(--avp-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{qi + 1}. {q.enunciado}</p>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button type="button" onClick={() => abrirEdicao(q)} style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600 }}>Editar</button>
                      <button type="button" onClick={() => excluir(q.id)} style={{ background: '#e6394615', border: '1px solid #e6394630', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--avp-danger)', fontWeight: 600 }}>Excluir</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {q.alternativas.map((a, ai) => (
                      <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: a.correta ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                        <span style={{ fontWeight: 700, width: 16 }}>{letraAlt(ai)})</span>
                        <span>{a.texto}</span>
                        {a.correta && <span style={{ marginLeft: 4, fontSize: 10, background: '#02A15320', color: 'var(--avp-green)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>✓ Correta</span>}
                      </div>
                    ))}
                  </div>
                  {q.explicacao && <p style={{ marginTop: 8, fontSize: 11, color: 'var(--avp-text-dim)', fontStyle: 'italic' }}>💡 {q.explicacao}</p>}
                </div>
              ))}

              {questoes.length === 0 && !adicionando && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📝</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 16 }}>Nenhuma pergunta ainda. Adicione pelo menos uma para o quiz funcionar.</p>
                  <button type="button" onClick={() => setAdicionando(true)} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>+ Adicionar primeira pergunta</button>
                </div>
              )}

              {adicionando && (
                <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-blue)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{editandoId ? 'Editar questão' : 'Nova questão'}</p>
                    <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600 }}>Pergunta *</label>
                    <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={enunciado} onChange={e => setEnunciado(e.target.value)} placeholder="Digite a pergunta..." />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>Alternativas * <span style={{ fontWeight: 400 }}>(marque a correta)</span></label>
                      {alts.length < 6 && <button type="button" onClick={addAlternativa} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>+ Opção</button>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {alts.map((alt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="radio" name={`correta-${aulaId}`} checked={alt.correta} onChange={() => setCorreta(i)} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)', flexShrink: 0, cursor: 'pointer' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', width: 20, flexShrink: 0 }}>{letraAlt(i)})</span>
                          <input style={{ ...inp, flex: 1 }} value={alt.texto} onChange={e => setTextoAlt(i, e.target.value)} placeholder={`Opção ${letraAlt(i)}`} />
                          {alts.length > 2 && <button type="button" onClick={() => removeAlternativa(i)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 0 }}>×</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 6, fontWeight: 600 }}>Explicação (opcional)</label>
                    <input style={inp} value={explicacao} onChange={e => setExplicacao(e.target.value)} placeholder="Explique o porquê da resposta correta..." />
                  </div>
                  {msg && <p style={{ fontSize: 12, color: msg.includes('atualizada') || msg.includes('adicionada') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>{msg}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={salvar} disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: salvando ? 0.7 : 1 }}>
                      {salvando ? 'Salvando...' : editandoId ? '✓ Atualizar' : '✓ Salvar questão'}
                    </button>
                    <button type="button" onClick={resetForm} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                  </div>
                </div>
              )}

              {msg && !adicionando && <p style={{ fontSize: 12, color: msg.includes('adicionada') || msg.includes('atualizada') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>{msg}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
