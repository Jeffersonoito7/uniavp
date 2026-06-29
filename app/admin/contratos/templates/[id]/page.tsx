'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '../../../AdminLayout'
import Link from 'next/link'

const inputStyle: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

export default function EditarTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', descricao: '', corpo_html: '', variaveis: '', ativo: true })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [preview, setPreview] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  useEffect(() => {
    fetch(`/api/admin/contrato-templates/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.template) {
          const t = data.template
          setForm({ nome: t.nome, descricao: t.descricao ?? '', corpo_html: t.corpo_html, variaveis: (t.variaveis ?? []).join(', '), ativo: t.ativo })
        }
        setLoading(false)
      })
  }, [id])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const variaveis = form.variaveis.split(',').map(v => v.trim()).filter(Boolean)
    const res = await fetch(`/api/admin/contrato-templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, descricao: form.descricao || null, corpo_html: form.corpo_html, variaveis, ativo: form.ativo }),
    })
    const data = await res.json()
    if (data.ok) {
      setMsg({ tipo: 'ok', texto: 'Template salvo com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 3000)
  }

  // Substitui variaveis no preview com valores de exemplo
  function renderPreview() {
    const variaveis = form.variaveis.split(',').map(v => v.trim()).filter(Boolean)
    const exemplos: Record<string, string> = {
      nome: 'João da Silva', cpf: '000.000.000-00', data: new Date().toLocaleDateString('pt-BR'),
      cargo: 'Consultor', empresa: 'AutoVale Prevencoes', cnpj: '00.000.000/0001-00',
      email: 'joao@email.com', whatsapp: '(11) 99999-9999', endereco: 'Rua Exemplo, 123',
    }
    let html = form.corpo_html
    for (const v of variaveis) {
      html = html.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), exemplos[v] ?? `[${v}]`)
    }
    return html
  }

  if (loading) return <AdminLayout><p style={{ color: 'var(--avp-text-dim)', padding: 40, textAlign: 'center' }}>Carregando...</p></AdminLayout>

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/contratos/templates" style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>← Templates</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>Editar Template</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setPreview(p => !p)} style={{ background: preview ? 'var(--avp-blue)' : 'none', border: '1px solid var(--avp-border)', color: preview ? '#fff' : 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {preview ? 'Editar' : 'Preview'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
          {msg.texto}
        </div>
      )}

      {preview ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, color: '#111', fontSize: 14, lineHeight: 1.7, minHeight: 400 }}
          dangerouslySetInnerHTML={{ __html: renderPreview() }} />
      ) : (
        <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label style={labelStyle}>Nome do template *</label>
              <input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <div onClick={() => setForm(p => ({ ...p, ativo: !p.ativo }))} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
                <div style={{ width: 42, height: 24, borderRadius: 12, background: form.ativo ? '#02A153' : '#444', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.ativo ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 14, color: form.ativo ? 'var(--avp-green)' : 'var(--avp-text-dim)', fontWeight: 600 }}>{form.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Descricao (opcional)</label>
            <input style={inputStyle} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Variaveis <span style={{ color: 'var(--avp-text-dim)', fontWeight: 400 }}>(separadas por virgula)</span></label>
            <input style={inputStyle} value={form.variaveis} onChange={e => setForm(p => ({ ...p, variaveis: e.target.value }))} placeholder="nome, cpf, data, cargo, empresa" />
            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Use no corpo como: {'{{nome}}'}, {'{{cpf}}'}, {'{{data}}'}</p>
          </div>
          <div>
            <label style={labelStyle}>Corpo do contrato (HTML) *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 420, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
              value={form.corpo_html}
              onChange={e => setForm(p => ({ ...p, corpo_html: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/admin/contratos/templates')} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
            <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar Template'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
