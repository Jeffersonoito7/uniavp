'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminLayout from '../../AdminLayout'
import PhoneInput from '@/app/components/PhoneInput'
import Link from 'next/link'

type Template = { id: string; nome: string; variaveis: string[] }
type Assinante = { papel: string; nome: string; email: string; whatsapp: string; cpf: string }
type ContratoBase = { id: string; titulo: string; numero_registro: string }

const inputStyle: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

export default function NovoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const baseId = searchParams.get('base')

  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<'principal' | 'aditivo'>(baseId ? 'aditivo' : 'principal')
  const [contratoBase, setContratoBase] = useState<ContratoBase | null>(null)
  const [variaveis, setVariaveis] = useState<Record<string, string>>({})
  const [assinantes, setAssinantes] = useState<Assinante[]>([{ papel: 'destinatario', nome: '', email: '', whatsapp: '', cpf: '' }])
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/contrato-templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
  }, [])

  useEffect(() => {
    if (!baseId) return
    fetch(`/api/admin/contratos-digitais/${baseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.contrato) {
          setContratoBase(d.contrato)
          setTitulo(`Aditivo — ${d.contrato.titulo}`)
          // Pre-popula assinantes do contrato original
          if (d.contrato.assinantes?.length > 0) {
            setAssinantes(d.contrato.assinantes.map((a: { papel: string; nome: string; email: string | null; whatsapp: string | null; cpf?: string }) => ({
              papel: a.papel, nome: a.nome, email: a.email ?? '', whatsapp: a.whatsapp ?? '', cpf: a.cpf ?? '',
            })))
          }
        }
      })
  }, [baseId])

  const templateSelecionado = templates.find(t => t.id === templateId)

  function addAssinante() {
    setAssinantes(prev => [...prev, { papel: 'terceiro', nome: '', email: '', whatsapp: '', cpf: '' }])
  }

  function removeAssinante(i: number) {
    setAssinantes(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAssinante(i: number, campo: keyof Assinante, valor: string) {
    setAssinantes(prev => prev.map((a, idx) => idx === i ? { ...a, [campo]: valor } : a))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/admin/contratos-digitais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId || null,
        titulo,
        tipo,
        contrato_base_id: baseId || null,
        variaveis_usadas: variaveis,
        assinantes: assinantes.map(a => ({ ...a, whatsapp: a.whatsapp.replace(/\D/g, '') })),
      }),
    })
    const data = await res.json()
    if (data.ok) {
      router.push(`/admin/contratos/${data.contrato.id}`)
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar contrato.' })
      setSalvando(false)
    }
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <Link href={contratoBase ? `/admin/contratos/${contratoBase.id}` : '/admin/contratos'} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>
          {contratoBase ? `← ${contratoBase.titulo}` : '← Contratos'}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>
          {contratoBase ? 'Novo Aditivo' : 'Novo Contrato'}
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Preencha os dados e envie os links de assinatura automaticamente por WhatsApp.</p>
      </div>

      {contratoBase && (
        <div style={{ background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14 }}>
          Aditivo vinculado ao contrato: <strong>{contratoBase.titulo}</strong> <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--avp-text-dim)' }}>N. {contratoBase.numero_registro}</span>
        </div>
      )}

      {msg && (
        <div style={{ padding: '12px 16px', background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, color: 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
          {msg.texto}
        </div>
      )}

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Dados basicos */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Dados do contrato</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Titulo do contrato *</label>
              <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Contrato de Representacao — Joao Silva" required />
            </div>
            <div>
              <label style={labelStyle}>Template (opcional)</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={templateId} onChange={e => setTemplateId(e.target.value)}>
                <option value="">Sem template (corpo vazio)</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={tipo} onChange={e => setTipo(e.target.value as 'principal' | 'aditivo')}>
                <option value="principal">Contrato principal</option>
                <option value="aditivo">Aditivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Variaveis do template */}
        {templateSelecionado && templateSelecionado.variaveis.length > 0 && (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Preencher variaveis do template</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 18 }}>Esses valores serao inseridos automaticamente no corpo do contrato.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {templateSelecionado.variaveis.map(v => (
                <div key={v}>
                  <label style={labelStyle}>{`{{${v}}}`}</label>
                  <input style={inputStyle} value={variaveis[v] ?? ''} onChange={e => setVariaveis(p => ({ ...p, [v]: e.target.value }))} placeholder={v} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assinantes */}
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Assinantes</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>A AVP ja e considerada assinada (pre-assinada). Adicione aqui os demais assinantes.</p>
            </div>
            <button type="button" onClick={addAssinante} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              + Adicionar
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assinantes.map((a, i) => (
              <div key={i} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ background: i === 0 ? '#02A15320' : '#f59e0b20', color: i === 0 ? '#02A153' : '#f59e0b', border: `1px solid ${i === 0 ? '#02A15340' : '#f59e0b40'}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <select style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '4px 10px', color: 'var(--avp-text)', fontSize: 13, cursor: 'pointer' }} value={a.papel} onChange={e => updateAssinante(i, 'papel', e.target.value)}>
                      <option value="destinatario">Destinatario</option>
                      <option value="terceiro">Terceiro (NF / representante)</option>
                    </select>
                  </div>
                  {i > 0 && (
                    <button type="button" onClick={() => removeAssinante(i)} style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 20, padding: 0 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nome *</label>
                    <input style={inputStyle} value={a.nome} onChange={e => updateAssinante(i, 'nome', e.target.value)} required placeholder="Nome completo" />
                  </div>
                  <div>
                    <label style={labelStyle}>CPF</label>
                    <input style={inputStyle} value={a.cpf} onChange={e => updateAssinante(i, 'cpf', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label style={labelStyle}>WhatsApp (link sera enviado aqui)</label>
                    <PhoneInput value={a.whatsapp} onChange={v => updateAssinante(i, 'whatsapp', v)} style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
                  </div>
                  <div>
                    <label style={labelStyle}>E-mail</label>
                    <input type="email" style={inputStyle} value={a.email} onChange={e => updateAssinante(i, 'email', e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Link href="/admin/contratos" style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '12px 22px', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancelar
          </Link>
          <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Enviando...' : 'Criar e Enviar Links'}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
