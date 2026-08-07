'use client'

import { useState, useMemo } from 'react'

type Template = { id: string; nome: string }
type Aluno = { id: string; nome: string | null; whatsapp: string | null; email: string | null; cpf: string | null }

const inp: React.CSSProperties = {
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
const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }
const card: React.CSSProperties = {
  background: 'var(--avp-card)',
  border: '1px solid var(--avp-border)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
}

export default function ContratoAvulsoCliente({ templates, alunos }: { templates: Template[]; alunos: Aluno[] }) {
  const [templateId, setTemplateId] = useState('')
  const [contratadoPreenche, setContratadoPreenche] = useState(true)
  const [busca, setBusca] = useState('')
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null)
  const [erro, setErro] = useState('')

  const alunosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    if (!q) return alunos
    return alunos.filter(a =>
      (a.nome ?? '').toLowerCase().includes(q) ||
      (a.whatsapp ?? '').includes(q) ||
      (a.email ?? '').toLowerCase().includes(q)
    )
  }, [alunos, busca])

  function selecionar(a: Aluno) {
    setAlunoSelecionado(a)
    setBusca(a.nome ?? '')
    setResultado(null)
    setErro('')
  }

  function limpar() {
    setAlunoSelecionado(null)
    setBusca('')
    setResultado(null)
    setErro('')
  }

  async function enviar() {
    if (!templateId) { setErro('Selecione um template.'); return }
    if (!alunoSelecionado) { setErro('Selecione um aluno.'); return }
    setErro('')
    setResultado(null)
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/contratos/disparar-massa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          alunoIds: [alunoSelecionado.id],
          contratadoPreenche,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error ?? 'Erro ao enviar contrato.')
        return
      }
      if (json.enviados > 0) {
        setResultado({ ok: true, mensagem: `Contrato enviado com sucesso para ${alunoSelecionado.nome} via WhatsApp.` })
        setAlunoSelecionado(null)
        setBusca('')
        setTemplateId('')
      } else if (json.ja_possui_contrato?.length > 0) {
        setResultado({ ok: false, mensagem: `${alunoSelecionado.nome} já possui um contrato ativo com este template.` })
      } else {
        const errMsg = json.erros?.[0] ?? 'Não foi possível enviar o contrato.'
        setResultado({ ok: false, mensagem: errMsg })
      }
    } catch {
      setErro('Falha na requisição. Verifique a conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const mostrarLista = busca.trim().length > 0 && !alunoSelecionado

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Template */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--avp-text)', marginBottom: 20 }}>1. Selecione o template</h2>
        <div>
          <label style={lbl}>Template de contrato</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={inp}>
            <option value="">-- Selecione --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}
          onClick={() => setContratadoPreenche(p => !p)}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            border: '2px solid var(--avp-accent)',
            background: contratadoPreenche ? 'var(--avp-accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {contratadoPreenche && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>&#10003;</span>}
          </div>
          <span style={{ color: 'var(--avp-text)', fontSize: 14 }}>Contratado preenche os próprios dados ao abrir o link</span>
        </div>
      </div>

      {/* Aluno */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--avp-text)', marginBottom: 20 }}>2. Selecione o aluno</h2>

        {alunoSelecionado ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--avp-accent)12', border: '1px solid var(--avp-accent)40', borderRadius: 10, padding: '14px 16px' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--avp-text)', fontSize: 15 }}>{alunoSelecionado.nome}</div>
              <div style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>
                {alunoSelecionado.whatsapp} {alunoSelecionado.email ? `· ${alunoSelecionado.email}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={limpar}
              style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}
            >
              Trocar
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <label style={lbl}>Buscar aluno por nome, WhatsApp ou e-mail</label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setAlunoSelecionado(null) }}
              style={inp}
              autoComplete="off"
            />
            {mostrarLista && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--avp-card)', border: '1px solid var(--avp-border)',
                borderRadius: 8, marginTop: 4, maxHeight: 280, overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {alunosFiltrados.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    Nenhum aluno encontrado.
                  </div>
                ) : alunosFiltrados.slice(0, 20).map(a => (
                  <div
                    key={a.id}
                    onClick={() => selecionar(a)}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--avp-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--avp-accent)10')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--avp-text)', fontSize: 14 }}>{a.nome ?? '(sem nome)'}</div>
                    <div style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginTop: 2 }}>
                      {a.whatsapp} {a.email ? `· ${a.email}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {resultado && (
        <div style={{
          background: resultado.ok ? '#02A15320' : '#f59e0b20',
          border: `1px solid ${resultado.ok ? '#02A153' : '#f59e0b'}40`,
          borderRadius: 10, padding: '14px 18px', marginBottom: 16,
          color: resultado.ok ? '#02A153' : '#f59e0b',
          fontWeight: 600, fontSize: 14,
        }}>
          {resultado.mensagem}
        </div>
      )}
      {erro && (
        <div style={{ background: '#e6394620', border: '1px solid #e6394640', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#e63946', fontSize: 14, fontWeight: 600 }}>
          {erro}
        </div>
      )}

      {/* Botão */}
      <button
        onClick={enviar}
        disabled={enviando || !templateId || !alunoSelecionado}
        style={{
          background: enviando || !templateId || !alunoSelecionado ? 'var(--avp-border)' : 'var(--avp-accent)',
          color: enviando || !templateId || !alunoSelecionado ? 'var(--avp-text-dim)' : '#fff',
          border: 'none', borderRadius: 8, padding: '13px 32px',
          fontWeight: 700, fontSize: 15,
          cursor: enviando || !templateId || !alunoSelecionado ? 'not-allowed' : 'pointer',
        }}
      >
        {enviando ? 'Enviando...' : 'Enviar contrato via WhatsApp'}
      </button>
    </div>
  )
}
