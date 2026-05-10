'use client'
import { useState } from 'react'

type Alternativa = { texto: string; correta: boolean }
type Questao = { id: string; enunciado: string; alternativas: Alternativa[]; explicacao: string | null; ordem: number }

const ALT_VAZIAS: Alternativa[] = [
  { texto: '', correta: true },
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
]

export default function QuestoesAula({ aulaId, aprovacaoMinima }: { aulaId: string; aprovacaoMinima: number }) {
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [carregado, setCarregado] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  // Form nova questão
  const [enunciado, setEnunciado] = useState('')
  const [alts, setAlts] = useState<Alternativa[]>(ALT_VAZIAS.map(a => ({ ...a })))
  const [explicacao, setExplicacao] = useState('')

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  async function carregar() {
    if (carregado) return
    const res = await fetch(`/api/admin/questoes?aula_id=${aulaId}`)
    const data = await res.json()
    setQuestoes(data.questoes ?? [])
    setCarregado(true)
  }

  async function toggle() {
    if (!aberto) await carregar()
    setAberto(a => !a)
  }

  function setCorreta(idx: number) {
    setAlts(prev => prev.map((a, i) => ({ ...a, correta: i === idx })))
  }

  function setTextoAlt(idx: number, texto: string) {
    setAlts(prev => prev.map((a, i) => i === idx ? { ...a, texto } : a))
  }

  function addAlternativa() {
    if (alts.length >= 6) return
    setAlts(prev => [...prev, { texto: '', correta: false }])
  }

  function removeAlternativa(idx: number) {
    if (alts.length <= 2) return
    const novas = alts.filter((_, i) => i !== idx)
    // garante sempre uma correta
    if (!novas.some(a => a.correta)) novas[0].correta = true
    setAlts(novas)
  }

  function resetForm() {
    setEnunciado(''); setAlts(ALT_VAZIAS.map(a => ({ ...a }))); setExplicacao(''); setEditandoId(null); setAdicionando(false)
  }

  function abrirEdicao(q: Questao) {
    setEnunciado(q.enunciado)
    setAlts(q.alternativas.map(a => ({ ...a })))
    setExplicacao(q.explicacao ?? '')
    setEditandoId(q.id)
    setAdicionando(true)
  }

  async function salvar() {
    if (!enunciado.trim()) { setMsg('Preencha o enunciado.'); return }
    if (alts.some(a => !a.texto.trim())) { setMsg('Preencha todas as alternativas.'); return }
    if (!alts.some(a => a.correta)) { setMsg('Marque a alternativa correta.'); return }
    setSalvando(true); setMsg('')
    const body = { aula_id: aulaId, enunciado, alternativas: alts, explicacao: explicacao || null }

    if (editandoId) {
      const res = await fetch('/api/admin/questoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editandoId, ...body }) })
      const data = await res.json()
      if (data.questao) {
        setQuestoes(prev => prev.map(q => q.id === editandoId ? data.questao : q))
        setMsg('Questão atualizada!')
        resetForm()
      } else setMsg(data.error ?? 'Erro ao salvar.')
    } else {
      const res = await fetch('/api/admin/questoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.questao) {
        setQuestoes(prev => [...prev, data.questao])
        setMsg('Questão adicionada!')
        resetForm()
      } else setMsg(data.error ?? 'Erro ao salvar.')
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

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={toggle}
        style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '5px 12px', color: 'var(--avp-text-dim)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
        📝 Quiz {carregado ? `(${questoes.length} questão${questoes.length !== 1 ? 'ões' : ''})` : ''} · Mínimo: {aprovacaoMinima}%
      </button>

      {aberto && (
        <div style={{ marginTop: 12, background: 'var(--avp-black)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>QUESTÕES DO QUIZ</p>
            {!adicionando && (
              <button type="button" onClick={() => setAdicionando(true)}
                style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                + Adicionar questão
              </button>
            )}
          </div>

          {/* Lista de questões */}
          {questoes.map((q, qi) => (
            <div key={q.id} style={{ background: 'var(--avp-card)', borderRadius: 8, padding: 14, border: '1px solid var(--avp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{qi + 1}. {q.enunciado}</p>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => abrirEdicao(q)}
                    style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 600 }}>Editar</button>
                  <button type="button" onClick={() => excluir(q.id)}
                    style={{ background: '#e6394615', border: '1px solid #e6394630', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--avp-danger)', fontWeight: 600 }}>Excluir</button>
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
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Nenhuma questão ainda. Adicione pelo menos uma para o quiz funcionar.</p>
          )}

          {/* Formulário adicionar/editar questão */}
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
                  <label style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 600 }}>Alternativas * <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>(marque a correta)</span></label>
                  {alts.length < 6 && (
                    <button type="button" onClick={addAlternativa} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>+ Opção</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alts.map((alt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="radio" name={`correta-${aulaId}`} checked={alt.correta} onChange={() => setCorreta(i)}
                        style={{ width: 16, height: 16, accentColor: 'var(--avp-green)', flexShrink: 0, cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', width: 20, flexShrink: 0 }}>{letraAlt(i)})</span>
                      <input style={{ ...inp, flex: 1 }} value={alt.texto} onChange={e => setTextoAlt(i, e.target.value)} placeholder={`Opção ${letraAlt(i)}`} />
                      {alts.length > 2 && (
                        <button type="button" onClick={() => removeAlternativa(i)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: 0 }}>×</button>
                      )}
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
                <button type="button" onClick={salvar} disabled={salvando}
                  style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : editandoId ? '✓ Atualizar' : '✓ Salvar questão'}
                </button>
                <button type="button" onClick={resetForm}
                  style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {msg && !adicionando && <p style={{ fontSize: 12, color: msg.includes('adicionada') || msg.includes('atualizada') ? 'var(--avp-green)' : 'var(--avp-danger)' }}>{msg}</p>}
        </div>
      )}
    </div>
  )
}
