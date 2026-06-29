'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '../../AdminLayout'
import Link from 'next/link'

type Template = {
  id: string
  nome: string
  descricao: string | null
  variaveis: string[]
  ativo: boolean
  arquivado: boolean
  created_at: string
}

const inputStyle: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', corpo_html: '', variaveis: '' })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const res = await fetch('/api/admin/contrato-templates')
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const variaveis = form.variaveis.split(',').map(v => v.trim()).filter(Boolean)
    const res = await fetch('/api/admin/contrato-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, descricao: form.descricao || null, corpo_html: form.corpo_html, variaveis }),
    })
    const data = await res.json()
    if (data.ok) {
      setTemplates(prev => [data.template, ...prev])
      setForm({ nome: '', descricao: '', corpo_html: '', variaveis: '' })
      setShowNovo(false)
      setMsg({ tipo: 'ok', texto: 'Template criado com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar template.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 4000)
  }

  async function arquivar(id: string) {
    if (!confirm('Arquivar este template? Contratos existentes nao sao afetados.')) return
    await fetch(`/api/admin/contrato-templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ arquivado: true }) })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/contratos" style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>← Contratos</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>Templates de Contrato</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Crie e gerencie os modelos de texto usados nos contratos.</p>
        </div>
        <button onClick={() => setShowNovo(true)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Novo Template
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
          {msg.texto}
        </div>
      )}

      {/* Modal novo template */}
      {showNovo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowNovo(false)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 680, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Novo Template</h2>
              <button onClick={() => setShowNovo(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome do template *</label>
                <input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Contrato Consultor PF" required />
              </div>
              <div>
                <label style={labelStyle}>Descricao (opcional)</label>
                <input style={inputStyle} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Uso interno para identificar o template" />
              </div>
              <div>
                <label style={labelStyle}>Variaveis disponiveis <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>(separadas por virgula)</span></label>
                <input style={inputStyle} value={form.variaveis} onChange={e => setForm(p => ({ ...p, variaveis: e.target.value }))} placeholder="nome, cpf, data, cargo, empresa" />
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Use no corpo como: {'{{nome}}'}, {'{{cpf}}'}, {'{{data}}'}</p>
              </div>
              <div>
                <label style={labelStyle}>Corpo do contrato (HTML) *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 280, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                  value={form.corpo_html}
                  onChange={e => setForm(p => ({ ...p, corpo_html: e.target.value }))}
                  placeholder={'<h2>CONTRATO DE REPRESENTAÇÃO</h2>\n<p>Pelo presente instrumento, <strong>{{nome}}</strong>, CPF {{cpf}}...</p>'}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNovo(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Criar Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de templates */}
      {loading ? (
        <p style={{ color: 'var(--avp-text-dim)', padding: 32, textAlign: 'center' }}>Carregando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map(t => (
            <div key={t.id} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--avp-text)', margin: 0 }}>{t.nome}</p>
                  <span style={{ background: t.ativo ? '#02A15320' : '#6b728020', color: t.ativo ? '#02A153' : '#6b7280', border: `1px solid ${t.ativo ? '#02A15340' : '#6b728040'}`, borderRadius: 6, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                    {t.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {t.descricao && <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: 0 }}>{t.descricao}</p>}
                {t.variaveis?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {t.variaveis.map(v => (
                      <span key={v} style={{ background: 'rgba(79,70,229,0.1)', color: '#818cf8', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href={`/admin/contratos/templates/${t.id}`} style={{ background: 'var(--avp-blue)', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Editar
                </Link>
                <button onClick={() => arquivar(t.id)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                  Arquivar
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--avp-text-dim)' }}>
              Nenhum template criado ainda. Crie o primeiro template para comecar a enviar contratos.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
