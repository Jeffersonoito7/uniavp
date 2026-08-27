'use client'
import { useState } from 'react'

type Alternativa = { texto: string; correta: boolean }
type Pergunta = { id: string; ordem: number; texto: string; alternativas: Alternativa[]; ativa: boolean }

const altVazia = (): Alternativa => ({ texto: '', correta: false })

const formVazio = () => ({
  texto: '',
  alternativas: [altVazia(), altVazia(), altVazia(), altVazia()],
  ordem: 0,
})

export default function FunilConsultorCliente({ perguntasIniciais }: { perguntasIniciais: Pergunta[] }) {
  const [perguntas, setPerguntas] = useState<Pergunta[]>(perguntasIniciais)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Pergunta | null>(null)
  const [form, setForm] = useState(formVazio())
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  function abrirNovo() {
    setEditando(null)
    setForm(formVazio())
    setShowForm(true)
  }

  function abrirEditar(p: Pergunta) {
    setEditando(p)
    setForm({ texto: p.texto, alternativas: p.alternativas, ordem: p.ordem })
    setShowForm(true)
  }

  function setAlt(idx: number, campo: keyof Alternativa, valor: string | boolean) {
    setForm(f => ({
      ...f,
      alternativas: f.alternativas.map((a, i) =>
        i === idx ? { ...a, [campo]: valor } : campo === 'correta' && valor === true ? { ...a, correta: false } : a,
      ),
    }))
  }

  function marcarCorreta(idx: number) {
    setForm(f => ({
      ...f,
      alternativas: f.alternativas.map((a, i) => ({ ...a, correta: i === idx })),
    }))
  }

  async function salvar() {
    const correta = form.alternativas.filter(a => a.correta)
    if (!form.texto.trim()) return setMsg({ tipo: 'err', texto: 'Texto da pergunta e obrigatorio' })
    if (form.alternativas.some(a => !a.texto.trim())) return setMsg({ tipo: 'err', texto: 'Preencha todas as alternativas' })
    if (correta.length !== 1) return setMsg({ tipo: 'err', texto: 'Marque exatamente uma alternativa como correta' })

    setSalvando(true)
    setMsg(null)

    const metodo = editando ? 'PUT' : 'POST'
    const body = editando
      ? { id: editando.id, ...form }
      : form

    const res = await fetch('/api/admin/funil-consultor/perguntas', {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()

    if (!res.ok) {
      setMsg({ tipo: 'err', texto: json.error ?? 'Erro ao salvar' })
    } else {
      if (editando) {
        setPerguntas(ps => ps.map(p => p.id === editando.id ? { ...p, ...form } : p))
      } else {
        setPerguntas(ps => [...ps, json.pergunta])
      }
      setShowForm(false)
      setMsg({ tipo: 'ok', texto: editando ? 'Pergunta atualizada' : 'Pergunta criada' })
    }
    setSalvando(false)
  }

  async function toggleAtiva(p: Pergunta) {
    await fetch('/api/admin/funil-consultor/perguntas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, ativa: !p.ativa }),
    })
    setPerguntas(ps => ps.map(x => x.id === p.id ? { ...x, ativa: !x.ativa } : x))
  }

  async function excluir(p: Pergunta) {
    if (!confirm(`Excluir a pergunta "${p.texto.substring(0, 40)}..."?`)) return
    await fetch('/api/admin/funil-consultor/perguntas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id }),
    })
    setPerguntas(ps => ps.filter(x => x.id !== p.id))
  }

  const letras = ['A', 'B', 'C', 'D']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Funil de Onboarding</h1>
          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '4px 0 0' }}>
            Perguntas do quiz enviadas por WhatsApp para novos consultores.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          + Nova Pergunta
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: msg.tipo === 'ok' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${msg.tipo === 'ok' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, color: msg.tipo === 'ok' ? '#4ade80' : '#f87171', fontSize: 13 }}>
          {msg.texto}
        </div>
      )}

      {/* Instrucoes do fluxo */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text-dim)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fluxo do funil</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['1. Admin inicia via botao no consultor', '2. Bot pergunta se quer a oportunidade', '3. Envia link do video PP', '4. Aplica quiz abaixo', '5. Envia link do sistema South'].map((s, i) => (
            <span key={i} style={{ fontSize: 12, background: 'var(--avp-border)', borderRadius: 6, padding: '4px 10px', color: 'var(--avp-text)' }}>{s}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '10px 0 0' }}>
          Configure o link do video PP, nota de corte e link do sistema South em <strong>Configuracoes</strong>.
        </p>
      </div>

      {/* Lista de perguntas */}
      {perguntas.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--avp-text-dim)', fontSize: 14 }}>
          Nenhuma pergunta cadastrada. Clique em &quot;+ Nova Pergunta&quot; para comecar.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {perguntas.sort((a, b) => a.ordem - b.ordem).map((p, idx) => (
          <div key={p.id} style={{ background: 'var(--avp-card)', border: `1px solid ${p.ativa ? 'var(--avp-border)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 12, padding: '16px 18px', opacity: p.ativa ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 4px' }}>Pergunta {idx + 1} (ordem {p.ordem})</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--avp-text)', margin: 0 }}>{p.texto}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => abrirEditar(p)} style={{ background: 'var(--avp-border)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--avp-text)' }}>Editar</button>
                <button onClick={() => toggleAtiva(p)} style={{ background: p.ativa ? 'rgba(248,113,113,0.15)' : 'rgba(74,222,128,0.15)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: p.ativa ? '#f87171' : '#4ade80' }}>
                  {p.ativa ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => excluir(p)} style={{ background: 'rgba(248,113,113,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: '#f87171' }}>Excluir</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(p.alternativas as Alternativa[]).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: a.correta ? '#4ade80' : 'var(--avp-text-dim)', width: 20 }}>{letras[i]})</span>
                  <span style={{ color: a.correta ? '#4ade80' : 'var(--avp-text)' }}>{a.texto}</span>
                  {a.correta && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>correta</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>{editando ? 'Editar Pergunta' : 'Nova Pergunta'}</p>

            <label style={{ fontSize: 12, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 4 }}>Texto da pergunta</label>
            <textarea
              value={form.texto}
              onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
              rows={3}
              style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 12, color: 'var(--avp-text-dim)', display: 'block', margin: '14px 0 4px' }}>Ordem de exibicao</label>
            <input
              type="number"
              value={form.ordem}
              onChange={e => setForm(f => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
              style={{ width: 80, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }}
            />

            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '14px 0 8px' }}>Alternativas (clique no circulo para marcar a correta)</p>
            {form.alternativas.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <button
                  onClick={() => marcarCorreta(i)}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${a.correta ? '#4ade80' : 'var(--avp-border)'}`, background: a.correta ? '#4ade80' : 'transparent', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--avp-text-dim)', width: 20 }}>{letras[i]})</span>
                <input
                  value={a.texto}
                  onChange={e => setAlt(i, 'texto', e.target.value)}
                  placeholder={`Alternativa ${letras[i]}`}
                  style={{ flex: 1, background: 'var(--avp-black)', border: `1px solid ${a.correta ? '#4ade8044' : 'var(--avp-border)'}`, borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none' }}
                />
              </div>
            ))}

            {msg && showForm && (
              <p style={{ color: '#f87171', fontSize: 13, margin: '8px 0 0' }}>{msg.texto}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={salvar}
                disabled={salvando}
                style={{ flex: 1, background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => { setShowForm(false); setMsg(null) }}
                style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
