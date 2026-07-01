'use client'
import { useState } from 'react'

type Template = { id: string; nome: string }

export default function ContratoObrigatorioConfig({
  templates,
  templateAtualId,
}: {
  templates: Template[]
  templateAtualId: string | null
}) {
  const [templateId, setTemplateId] = useState(templateAtualId ?? '')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  async function salvar() {
    setSalvando(true)
    setMsg('')
    const res = await fetch('/api/admin/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        chave: 'contrato_digital_obrigatorio_id',
        valor: templateId || '',
      }]),
    })
    setSalvando(false)
    if (res.ok) {
      setMsg(templateId ? 'Contrato obrigatorio ativado.' : 'Contrato obrigatorio desativado.')
    } else {
      setMsg('Erro ao salvar. Tente novamente.')
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const card: React.CSSProperties = {
    background: 'var(--avp-card)',
    border: '1px solid var(--avp-border)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
  }

  return (
    <div style={card}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--avp-text)', margin: '0 0 4px' }}>
          Contrato obrigatorio
        </h2>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>
          Quando ativo, todo aluno (FREE ou PRO) sera redirecionado para assinar o contrato antes de acessar o painel. Funciona uma unica vez: apos assinar, nao e mais exibido.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Template do contrato
          </label>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--avp-bg)',
              border: '1px solid var(--avp-border)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--avp-text)',
              fontSize: 14,
            }}
          >
            <option value="">-- Desativado --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            background: 'var(--avp-green)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontWeight: 700,
            fontSize: 14,
            cursor: salvando ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {msg && (
        <p style={{ marginTop: 10, fontSize: 13, color: msg.startsWith('Erro') ? '#e63946' : '#02A153', fontWeight: 600 }}>
          {msg}
        </p>
      )}

      {templateAtualId && !templateId && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
          Selecionar "Desativado" e salvar vai remover a obrigatoriedade do contrato.
        </p>
      )}
    </div>
  )
}
