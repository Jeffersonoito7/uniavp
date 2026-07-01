'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminLayout from '../../AdminLayout'
import PhoneInput from '@/app/components/PhoneInput'
import Link from 'next/link'

type Template = { id: string; nome: string; variaveis: string[]; corpo_html: string }
type ContratoBase = { id: string; titulo: string; numero_registro: string }

const inputStyle: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

type Destinatario = { whatsapp: string; email: string; nome: string }

export default function NovoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const baseId = searchParams.get('base')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<'principal' | 'aditivo'>(baseId ? 'aditivo' : 'principal')
  const [contratoBase, setContratoBase] = useState<ContratoBase | null>(null)
  const [corpoHtml, setCorpoHtml] = useState('')
  const [preview, setPreview] = useState(false)
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([{ whatsapp: '', email: '', nome: '' }])
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/contrato-templates?com_corpo=1')
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
          if (d.contrato.corpo_renderizado) setCorpoHtml(d.contrato.corpo_renderizado)
          if (d.contrato.assinantes?.length > 0) {
            setDestinatarios(d.contrato.assinantes.map((a: { nome: string; email: string | null; whatsapp: string | null }) => ({
              nome: a.nome ?? '', email: a.email ?? '', whatsapp: a.whatsapp ?? '',
            })))
          }
        }
      })
  }, [baseId])

  function aplicarTemplate(id: string) {
    setTemplateId(id)
    const t = templates.find(t => t.id === id)
    if (t) setCorpoHtml(t.corpo_html)
  }

  function addDestinatario() {
    setDestinatarios(prev => [...prev, { whatsapp: '', email: '', nome: '' }])
  }

  function removeDestinatario(i: number) {
    setDestinatarios(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateDestinatario(i: number, campo: keyof Destinatario, valor: string) {
    setDestinatarios(prev => prev.map((d, idx) => idx === i ? { ...d, [campo]: valor } : d))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!corpoHtml.trim()) {
      setMsg({ tipo: 'err', texto: 'O corpo do contrato nao pode estar vazio.' })
      return
    }
    const validos = destinatarios.filter(d => d.whatsapp || d.email)
    if (validos.length === 0) {
      setMsg({ tipo: 'err', texto: 'Informe ao menos WhatsApp ou email de um destinatario.' })
      return
    }
    setSalvando(true)
    setMsg(null)

    const res = await fetch('/api/admin/contratos-digitais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId || null,
        titulo,
        tipo,
        contrato_base_id: baseId || null,
        corpo_html_avulso: corpoHtml,
        assinantes: validos.map(d => ({
          papel: 'destinatario',
          nome: d.nome || null,
          email: d.email || null,
          whatsapp: d.whatsapp.replace(/\D/g, '') || null,
          cpf: null,
          destinatario_preenche: !d.nome,
        })),
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

  const card: React.CSSProperties = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href={contratoBase ? `/admin/contratos/${contratoBase.id}` : '/admin/contratos'} style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>
            {contratoBase ? `← ${contratoBase.titulo}` : '← Contratos'}
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>
            {contratoBase ? 'Novo Aditivo' : 'Novo Contrato'}
          </h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            O destinatario recebe o link, preenche os proprios dados e assina. Voce recebe copia por email.
          </p>
        </div>
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

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Dados basicos */}
        <div style={card}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Identificacao</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Titulo do contrato *</label>
              <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Contrato de Representacao" required />
            </div>
            <div>
              <label style={labelStyle}>Usar template (opcional)</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={templateId} onChange={e => aplicarTemplate(e.target.value)}>
                <option value="">Escrever manualmente</option>
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

        {/* Corpo do contrato */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Corpo do contrato *</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                Escreva em HTML. Use <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4 }}>{'{{nome}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4 }}>{'{{cpf}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 6px', borderRadius: 4 }}>{'{{data}}'}</code> — o destinatario vai preencher os proprios dados.
              </p>
            </div>
            <button type="button" onClick={() => setPreview(p => !p)}
              style={{ background: preview ? 'var(--avp-blue)' : 'none', border: '1px solid var(--avp-border)', color: preview ? '#fff' : 'var(--avp-text-dim)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              {preview ? 'Editar' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', color: '#111', fontSize: 14, lineHeight: 1.8, minHeight: 300 }}
              dangerouslySetInnerHTML={{ __html: corpoHtml }} />
          ) : (
            <textarea
              ref={textareaRef}
              value={corpoHtml}
              onChange={e => setCorpoHtml(e.target.value)}
              placeholder={'<p>Pelo presente instrumento, as partes abaixo qualificadas...</p>\n<p><strong>CONTRATANTE:</strong> AutoVale Prevencoes Ltda, CNPJ...</p>\n<p><strong>CONTRATADO:</strong> {{nome}}, CPF {{cpf}}, ...</p>'}
              style={{ ...inputStyle, minHeight: 340, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
            />
          )}
        </div>

        {/* Destinatarios */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Destinatarios</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                So informe WhatsApp ou email. O proprio destinatario vai preencher nome e CPF ao abrir o link.
              </p>
            </div>
            <button type="button" onClick={addDestinatario}
              style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              + Adicionar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {destinatarios.map((d, i) => (
              <div key={i} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ background: '#02A15320', color: '#02A153', border: '1px solid #02A15340', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                    Destinatario {destinatarios.length > 1 ? i + 1 : ''}
                  </span>
                  {destinatarios.length > 1 && (
                    <button type="button" onClick={() => removeDestinatario(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--avp-danger)', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>WhatsApp</label>
                    <PhoneInput value={d.whatsapp} onChange={v => updateDestinatario(i, 'whatsapp', v)} style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email (para copia assinada)</label>
                    <input type="email" style={inputStyle} value={d.email} onChange={e => updateDestinatario(i, 'email', e.target.value)} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>Nome (opcional — destinatario preenche)</label>
                    <input style={inputStyle} value={d.nome} onChange={e => updateDestinatario(i, 'nome', e.target.value)} placeholder="Deixar vazio = destinatario preenche" />
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
          <button type="submit" disabled={salvando}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Enviando...' : 'Criar e Enviar Links'}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
