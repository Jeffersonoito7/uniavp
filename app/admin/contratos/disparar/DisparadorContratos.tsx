'use client'

import { useState, useMemo } from 'react'

type Template = { id: string; nome: string }
type Aluno    = { id: string; nome: string | null; whatsapp: string | null }

interface Props {
  templates: Template[]
  alunos: Aluno[]
}

const inputStyle: React.CSSProperties = {
  background: 'var(--avp-black)',
  border: '1px solid var(--avp-border)',
  borderRadius: 8,
  padding: '10px 14px',
  color: 'var(--avp-text)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

export default function DisparadorContratos({ templates, alunos }: Props) {
  const [templateId, setTemplateId] = useState('')
  const [contratadoPreenche, setContratadoPreenche] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')
  const [disparando, setDisparando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; erros: string[] } | null>(null)
  const [erro, setErro] = useState('')

  const alunosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    if (!q) return alunos
    return alunos.filter(a =>
      (a.nome ?? '').toLowerCase().includes(q) ||
      (a.whatsapp ?? '').includes(q)
    )
  }, [alunos, busca])

  function toggleAluno(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    const idsFiltrados = alunosFiltrados.map(a => a.id)
    const todosSelecionados = idsFiltrados.every(id => selecionados.has(id))
    setSelecionados(prev => {
      const next = new Set(prev)
      if (todosSelecionados) {
        idsFiltrados.forEach(id => next.delete(id))
      } else {
        idsFiltrados.forEach(id => next.add(id))
      }
      return next
    })
  }

  async function disparar() {
    if (!templateId) { setErro('Selecione um template.'); return }
    if (selecionados.size === 0) { setErro('Selecione pelo menos um aluno.'); return }
    setErro('')
    setResultado(null)
    setDisparando(true)
    try {
      const res = await fetch('/api/admin/contratos/disparar-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, alunoIds: Array.from(selecionados), contratadoPreenche }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao disparar.'); return }
      setResultado({ enviados: json.enviados, erros: json.erros ?? [] })
      setSelecionados(new Set())
    } catch {
      setErro('Falha na requisicao. Verifique a conexao.')
    } finally {
      setDisparando(false)
    }
  }

  const todosFiltradosSelecionados = alunosFiltrados.length > 0 && alunosFiltrados.every(a => selecionados.has(a.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Template e opcoes */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--avp-text)', marginBottom: 20 }}>Configuracao do Disparo</h2>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={labelStyle}>Template de contrato</label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Selecione um template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setContratadoPreenche(p => !p)}>
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              border: '2px solid var(--avp-accent)',
              background: contratadoPreenche ? 'var(--avp-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {contratadoPreenche && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>&#10003;</span>}
            </div>
            <span style={{ color: 'var(--avp-text)', fontSize: 14 }}>Contratado preenche os proprios dados ao abrir o link</span>
          </div>
        </div>
      </div>

      {/* Lista de alunos */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--avp-text)' }}>
            Alunos ({selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''})
          </h2>
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ ...inputStyle, width: 260, maxWidth: '100%' }}
          />
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--avp-border)' }}>
          {/* Cabecalho */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--avp-black)', borderBottom: '1px solid var(--avp-border)', cursor: 'pointer', position: 'sticky', top: 0 }}
            onClick={toggleTodos}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: '2px solid var(--avp-accent)',
              background: todosFiltradosSelecionados ? 'var(--avp-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {todosFiltradosSelecionados && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
            </div>
            <span style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Selecionar todos ({alunosFiltrados.length})</span>
          </div>

          {/* Linhas */}
          {alunosFiltrados.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 14 }}>
              Nenhum aluno encontrado.
            </div>
          )}
          {alunosFiltrados.map(aluno => (
            <div
              key={aluno.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--avp-border)', cursor: 'pointer', background: selecionados.has(aluno.id) ? 'var(--avp-accent)10' : 'transparent' }}
              onClick={() => toggleAluno(aluno.id)}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: '2px solid var(--avp-accent)',
                background: selecionados.has(aluno.id) ? 'var(--avp-accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {selecionados.has(aluno.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
              </div>
              <div>
                <div style={{ color: 'var(--avp-text)', fontWeight: 600, fontSize: 14 }}>{aluno.nome ?? '(sem nome)'}</div>
                <div style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{aluno.whatsapp ?? 'Sem WhatsApp'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div style={{ background: resultado.erros.length === 0 ? '#02A15320' : '#f59e0b20', border: `1px solid ${resultado.erros.length === 0 ? '#02A153' : '#f59e0b'}40`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, color: resultado.erros.length === 0 ? '#02A153' : '#f59e0b', marginBottom: 8 }}>
            {resultado.enviados} contrato{resultado.enviados !== 1 ? 's' : ''} enviado{resultado.enviados !== 1 ? 's' : ''} com sucesso.
          </div>
          {resultado.erros.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--avp-text-dim)', fontSize: 13 }}>
              {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div style={{ background: '#e6394620', border: '1px solid #e6394640', borderRadius: 10, padding: '12px 16px', color: '#e63946', fontSize: 14, fontWeight: 600 }}>
          {erro}
        </div>
      )}

      {/* Botao */}
      <div>
        <button
          onClick={disparar}
          disabled={disparando || selecionados.size === 0 || !templateId}
          style={{
            background: disparando || selecionados.size === 0 || !templateId ? 'var(--avp-border)' : 'var(--avp-accent)',
            color: disparando || selecionados.size === 0 || !templateId ? 'var(--avp-text-dim)' : '#fff',
            border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: disparando || selecionados.size === 0 || !templateId ? 'not-allowed' : 'pointer',
          }}
        >
          {disparando ? 'Disparando...' : `Disparar contratos${selecionados.size > 0 ? ` (${selecionados.size})` : ''}`}
        </button>
      </div>
    </div>
  )
}
