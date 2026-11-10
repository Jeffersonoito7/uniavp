'use client'
import { useState, useEffect, useRef } from 'react'

type Resultado = {
  id: string
  nome_consultor: string
  whatsapp_consultor?: string
  indicacoes: number
  fechamentos: number
  observacao?: string
}

type ChatMsg = { role: 'user' | 'assistant'; conteudo: string }

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function labelMes(mes: string) {
  const [ano, m] = mes.split('-')
  return `${MESES[parseInt(m) - 1]} ${ano}`
}

export default function PainelEquipePage() {
  const [aba, setAba] = useState<'equipe' | 'coach'>('equipe')
  const [mes, setMes] = useState(mesAtual())
  const [meta, setMeta] = useState(0)
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [metaTemp, setMetaTemp] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [novoConsultor, setNovoConsultor] = useState({ nome_consultor: '', whatsapp_consultor: '', indicacoes: 0, fechamentos: 0, observacao: '' })
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [editTemp, setEditTemp] = useState<Partial<Resultado>>({})
  const [loading, setLoading] = useState(true)

  // Chat IA
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const inp: React.CSSProperties = {
    background: 'rgba(8,9,13,0.8)', border: '1px solid var(--avp-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  async function carregar() {
    setLoading(true)
    try {
      const r = await fetch(`/api/gestor/painel-equipe?mes=${mes}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Erro ao carregar dados')
      setMeta(d.meta?.meta_indicacoes ?? 0)
      setResultados(d.resultados ?? [])
    } catch (e: any) {
      setErroForm(e.message ?? 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  async function carregarChat() {
    try {
      const r = await fetch('/api/gestor/painel-ia')
      const d = await r.json()
      if (r.ok) setMsgs(d.mensagens ?? [])
    } catch {
      // silencioso: chat começa vazio
    }
  }

  useEffect(() => { carregar() }, [mes])
  useEffect(() => { if (aba === 'coach' && msgs.length === 0) carregarChat() }, [aba])
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [msgs])

  async function salvarMeta() {
    await fetch('/api/gestor/painel-equipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes, meta_indicacoes: parseInt(metaTemp) || 0 }),
    })
    setMeta(parseInt(metaTemp) || 0)
    setEditandoMeta(false)
  }

  async function adicionarConsultor() {
    if (!novoConsultor.nome_consultor.trim()) return
    try {
      const r = await fetch('/api/gestor/painel-equipe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, ...novoConsultor }),
      })
      const d = await r.json()
      if (!r.ok) { setErroForm(d.error ?? 'Erro ao adicionar'); return }
      setNovoConsultor({ nome_consultor: '', whatsapp_consultor: '', indicacoes: 0, fechamentos: 0, observacao: '' })
      setAdicionando(false)
      carregar()
    } catch {
      setErroForm('Erro de conexão')
    }
  }

  async function salvarEdicao(id: string) {
    await fetch('/api/gestor/painel-equipe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editTemp }),
    })
    setEditando(null)
    carregar()
  }

  async function remover(id: string) {
    if (!confirm('Remover consultor?')) return
    await fetch('/api/gestor/painel-equipe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    carregar()
  }

  async function enviarMsg() {
    if (!input.trim() || enviando) return
    const texto = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', conteudo: texto }])
    setEnviando(true)
    try {
      const r = await fetch('/api/gestor/painel-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: texto }),
      })
      const d = await r.json()
      if (!r.ok || !d.resposta) {
        setMsgs(m => [...m, { role: 'assistant', conteudo: d.error ?? 'Erro ao obter resposta. Tente novamente.' }])
      } else {
        setMsgs(m => [...m, { role: 'assistant', conteudo: d.resposta }])
      }
    } catch {
      setMsgs(m => [...m, { role: 'assistant', conteudo: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setEnviando(false)
    }
  }

  const totalIndicacoes = resultados.reduce((s, r) => s + (r.indicacoes || 0), 0)
  const totalFechamentos = resultados.reduce((s, r) => s + (r.fechamentos || 0), 0)
  const pct = meta > 0 ? Math.min(100, Math.round((totalIndicacoes / meta) * 100)) : 0

  const card: React.CSSProperties = {
    background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
    borderRadius: 12, padding: '20px 24px',
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 820, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Painel de Equipe</h1>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: erroForm ? 8 : 24 }}>Gerencie sua equipe e consulte o Coach APV</p>
      {erroForm && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#ef4444', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{erroForm}</span>
          <button onClick={() => setErroForm(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['equipe', 'coach'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: aba === a ? 'var(--avp-green)' : 'rgba(255,255,255,0.07)',
              color: aba === a ? '#000' : 'var(--avp-text-dim)' }}>
            {a === 'equipe' ? 'Equipe & Metas' : 'Coach APV'}
          </button>
        ))}
      </div>

      {aba === 'equipe' && (
        <>
          {/* Seletor de mes */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <label style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Mes:</label>
            <input type="month" value={mes.slice(0, 7)}
              onChange={e => setMes(e.target.value + '-01')}
              style={{ ...inp, width: 160 }} />
          </div>

          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ ...card, borderTop: '3px solid var(--avp-green)' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Meta do Mes</p>
              {editandoMeta ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={metaTemp} onChange={e => setMetaTemp(e.target.value)}
                    style={{ ...inp, width: 80 }} autoFocus />
                  <button onClick={salvarMeta} style={{ background: 'var(--avp-green)', color: '#000', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>OK</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{meta}</span>
                  <button onClick={() => { setMetaTemp(String(meta)); setEditandoMeta(true) }}
                    style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 12 }}>editar</button>
                </div>
              )}
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 2 }}>indicacoes alvo</p>
            </div>

            <div style={{ ...card, borderTop: '3px solid #3b82f6' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Realizadas</p>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{totalIndicacoes}</span>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 2 }}>indicacoes no mes</p>
            </div>

            <div style={{ ...card, borderTop: '3px solid #f59e0b' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fechamentos</p>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{totalFechamentos}</span>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 2 }}>vendas confirmadas</p>
            </div>

            <div style={{ ...card, borderTop: '3px solid #8b5cf6' }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Progresso</p>
              <span style={{ fontSize: 28, fontWeight: 900, color: pct >= 100 ? 'var(--avp-green)' : '#fff' }}>{pct}%</span>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, marginTop: 8 }}>
                <div style={{ background: pct >= 100 ? 'var(--avp-green)' : '#3b82f6', width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          {/* Lista de consultores */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Consultores — {labelMes(mes)}</h2>
              <button onClick={() => setAdicionando(true)}
                style={{ background: 'var(--avp-green)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                + Adicionar
              </button>
            </div>

            {adicionando && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'grid', gap: 10 }}>
                <input placeholder="Nome do consultor *" value={novoConsultor.nome_consultor}
                  onChange={e => setNovoConsultor(p => ({ ...p, nome_consultor: e.target.value }))} style={inp} />
                <input placeholder="WhatsApp (opcional)" value={novoConsultor.whatsapp_consultor}
                  onChange={e => setNovoConsultor(p => ({ ...p, whatsapp_consultor: e.target.value }))} style={inp} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input type="number" placeholder="Indicacoes" value={novoConsultor.indicacoes}
                    onChange={e => setNovoConsultor(p => ({ ...p, indicacoes: parseInt(e.target.value) || 0 }))} style={inp} />
                  <input type="number" placeholder="Fechamentos" value={novoConsultor.fechamentos}
                    onChange={e => setNovoConsultor(p => ({ ...p, fechamentos: parseInt(e.target.value) || 0 }))} style={inp} />
                </div>
                <input placeholder="Observacao (opcional)" value={novoConsultor.observacao}
                  onChange={e => setNovoConsultor(p => ({ ...p, observacao: e.target.value }))} style={inp} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={adicionarConsultor}
                    style={{ background: 'var(--avp-green)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}>
                    Salvar
                  </button>
                  <button onClick={() => setAdicionando(false)}
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--avp-text-dim)', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Carregando...</p>
            ) : resultados.length === 0 ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Nenhum consultor cadastrado para este mes.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resultados.map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 16px' }}>
                    {editando === r.id ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input type="number" placeholder="Indicacoes" value={editTemp.indicacoes ?? r.indicacoes}
                            onChange={e => setEditTemp(p => ({ ...p, indicacoes: parseInt(e.target.value) || 0 }))} style={inp} />
                          <input type="number" placeholder="Fechamentos" value={editTemp.fechamentos ?? r.fechamentos}
                            onChange={e => setEditTemp(p => ({ ...p, fechamentos: parseInt(e.target.value) || 0 }))} style={inp} />
                        </div>
                        <input placeholder="Observacao" value={editTemp.observacao ?? r.observacao ?? ''}
                          onChange={e => setEditTemp(p => ({ ...p, observacao: e.target.value }))} style={inp} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => salvarEdicao(r.id)}
                            style={{ background: 'var(--avp-green)', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                            Salvar
                          </button>
                          <button onClick={() => setEditando(null)}
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--avp-text-dim)', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 2 }}>{r.nome_consultor}</p>
                          {r.whatsapp_consultor && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{r.whatsapp_consultor}</p>}
                          {r.observacao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{r.observacao}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6', margin: 0 }}>{r.indicacoes}</p>
                            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>indicacoes</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b', margin: 0 }}>{r.fechamentos}</p>
                            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>fechamentos</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setEditando(r.id); setEditTemp({}) }}
                              style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--avp-text-dim)', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                              Editar
                            </button>
                            <button onClick={() => remover(r.id)}
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                              X
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {aba === 'coach' && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: 520 }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Coach APV</h2>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '4px 0 0' }}>
              Especialista em liderança e vendas de proteção veicular. Tire suas duvidas.
            </p>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--avp-text-dim)' }}>
                <p style={{ fontSize: 15, marginBottom: 8 }}>Ola! Sou o Coach APV.</p>
                <p style={{ fontSize: 13 }}>Pergunte sobre gestao de equipe, metas, motivacao, objecoes de clientes ou estrategias de venda.</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
                  background: m.role === 'user' ? 'var(--avp-green)' : 'rgba(255,255,255,0.07)',
                  color: m.role === 'user' ? '#000' : 'var(--avp-text)',
                  fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                  borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                }}>
                  {m.conteudo}
                </div>
              </div>
            ))}
            {enviando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                  Digitando...
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMsg()}
              placeholder="Digite sua duvida..."
              style={{ ...inp, flex: 1 }}
            />
            <button onClick={enviarMsg} disabled={enviando || !input.trim()}
              style={{ background: 'var(--avp-green)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: enviando ? 0.6 : 1 }}>
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
