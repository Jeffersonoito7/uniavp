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

const ESTRUTURA_PADRAO = `<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #111;">

  <h2 style="text-align:center; font-size:18px; text-transform:uppercase; margin-bottom:4px;">
    CONTRATO DE PRESTAÇÃO DE SERVIÇOS
  </h2>
  <p style="text-align:center; font-size:13px; color:#555; margin-bottom:32px;">
    Versão {{data}}
  </p>

  <h3 style="font-size:14px; text-transform:uppercase; border-bottom:2px solid #111; padding-bottom:6px; margin-bottom:14px;">
    QUALIFICAÇÃO DAS PARTES
  </h3>

  <p style="margin-bottom:6px;"><strong>CONTRATANTE:</strong></p>
  <p style="margin-bottom:4px;"><strong>Razão Social:</strong> AUTOVALE PREVENCOES LTDA</p>
  <p style="margin-bottom:4px;"><strong>CNPJ:</strong> XX.XXX.XXX/XXXX-XX</p>
  <p style="margin-bottom:4px;"><strong>Endereço:</strong> Rua Exemplo, 123 — Bairro, Cidade — UF, CEP 00000-000</p>
  <p style="margin-bottom:20px;"><strong>Representante Legal:</strong> Nome do Responsável</p>

  <p style="margin-bottom:6px;"><strong>CONTRATADO(A):</strong></p>
  <p style="margin-bottom:4px;"><strong>Nome:</strong> {{nome}}</p>
  <p style="margin-bottom:4px;"><strong>CPF:</strong> {{cpf}}</p>
  <p style="margin-bottom:4px;"><strong>WhatsApp:</strong> {{whatsapp}}</p>
  <p style="margin-bottom:4px;"><strong>E-mail:</strong> {{email}}</p>
  <p style="margin-bottom:20px;"><strong>Endereço:</strong> {{endereco}}</p>

  <h3 style="font-size:14px; text-transform:uppercase; border-bottom:2px solid #111; padding-bottom:6px; margin-bottom:14px;">
    CLÁUSULAS
  </h3>

  <p><strong>CLÁUSULA 1ª — DO OBJETO</strong></p>
  <p style="margin-bottom:16px;">
    O presente contrato tem por objeto a prestação de serviços de [descreva o serviço], pelo CONTRATADO(A) em favor da CONTRATANTE, nas condições aqui estabelecidas.
  </p>

  <p><strong>CLÁUSULA 2ª — DAS OBRIGAÇÕES DO CONTRATADO(A)</strong></p>
  <p style="margin-bottom:16px;">
    O CONTRATADO(A) se compromete a: [liste as obrigações].
  </p>

  <p><strong>CLÁUSULA 3ª — DA VIGÊNCIA</strong></p>
  <p style="margin-bottom:16px;">
    O presente contrato entra em vigor na data de sua assinatura, por prazo [determinado/indeterminado].
  </p>

  <p><strong>CLÁUSULA 4ª — DO FORO</strong></p>
  <p style="margin-bottom:32px;">
    As partes elegem o foro da comarca de [Cidade — UF] para dirimir quaisquer dúvidas oriundas deste contrato.
  </p>

  <p style="margin-bottom:4px;">Por estarem assim justas e acordadas, as partes assinam o presente instrumento eletronicamente.</p>
  <p><strong>Data:</strong> {{data}}</p>

</div>`

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
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Dados do contratado (preenchidos pelo admin manualmente)
  const [contratado, setContratado] = useState({
    nome: '', cpf: '', whatsapp: '', email: '', endereco: '',
  })

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
            const a = d.contrato.assinantes[0]
            setContratado({
              nome: a.nome ?? '',
              cpf: a.cpf ?? '',
              whatsapp: a.whatsapp ?? '',
              email: a.email ?? '',
              endereco: '',
            })
          }
        }
      })
  }, [baseId])

  function aplicarTemplate(id: string) {
    setTemplateId(id)
    const t = templates.find(t => t.id === id)
    if (t) setCorpoHtml(t.corpo_html)
  }

  function inserirEstruturaPadrao() {
    if (corpoHtml.trim() && !confirm('Isso vai substituir o corpo atual. Continuar?')) return
    setCorpoHtml(ESTRUTURA_PADRAO)
  }

  function upd(campo: keyof typeof contratado, valor: string) {
    setContratado(p => ({ ...p, [campo]: valor }))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!corpoHtml.trim()) {
      setMsg({ tipo: 'err', texto: 'O corpo do contrato nao pode estar vazio.' })
      return
    }
    if (!contratado.nome.trim()) {
      setMsg({ tipo: 'err', texto: 'Informe o nome do contratado.' })
      return
    }
    if (!contratado.whatsapp && !contratado.email) {
      setMsg({ tipo: 'err', texto: 'Informe WhatsApp ou email do contratado.' })
      return
    }
    setSalvando(true)
    setMsg(null)

    const variaveis: Record<string, string> = {
      nome: contratado.nome.trim(),
      cpf: contratado.cpf.trim(),
      whatsapp: contratado.whatsapp.trim(),
      email: contratado.email.trim(),
      endereco: contratado.endereco.trim(),
      data: new Date().toLocaleDateString('pt-BR'),
    }

    const res = await fetch('/api/admin/contratos-digitais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId || null,
        titulo,
        tipo,
        contrato_base_id: baseId || null,
        // Se template selecionado, usa variaveis. Se manual, substitui inline e envia como avulso
        ...(templateId
          ? { variaveis_usadas: variaveis }
          : { corpo_html_avulso: substituirVaraiveis(corpoHtml, variaveis), variaveis_usadas: variaveis }
        ),
        assinantes: [{
          papel: 'contratado',
          nome: contratado.nome.trim() || null,
          email: contratado.email.trim() || null,
          whatsapp: contratado.whatsapp.replace(/\D/g, '') || null,
          cpf: contratado.cpf.replace(/\D/g, '') || null,
          destinatario_preenche: false,
        }],
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

  function substituirVaraiveis(html: string, vars: Record<string, string>) {
    let out = html
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
    }
    return out
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
            Preencha os dados do contratado e o corpo do contrato. O link de assinatura e enviado automaticamente por WhatsApp.
          </p>
        </div>
      </div>

      {contratoBase && (
        <div style={{ background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 14 }}>
          Aditivo vinculado ao contrato: <strong>{contratoBase.titulo}</strong> <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--avp-text-dim)' }}>N. {contratoBase.numero_registro}</span>
        </div>
      )}

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
          {msg.texto}
        </div>
      )}

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Identificacao */}
        <div style={card}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Identificacao</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Titulo do contrato *</label>
              <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Contrato de Representacao — Consultor" required />
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

        {/* Dados do Contratado */}
        <div style={card}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Dados do Contratado</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: 0 }}>
              Preencha os dados do consultor. Eles substituem automaticamente <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{'{{nome}}'}</code>, <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{'{{cpf}}'}</code> etc. no corpo do contrato.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input style={inputStyle} value={contratado.nome} onChange={e => upd('nome', e.target.value)} placeholder="Nome completo do consultor" required />
            </div>
            <div>
              <label style={labelStyle}>CPF</label>
              <input style={inputStyle} value={contratado.cpf} onChange={e => upd('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <PhoneInput value={contratado.whatsapp} onChange={v => upd('whatsapp', v)} style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
            </div>
            <div>
              <label style={labelStyle}>E-mail (para receber copia assinada)</label>
              <input type="email" style={inputStyle} value={contratado.email} onChange={e => upd('email', e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Endereco</label>
              <input style={inputStyle} value={contratado.endereco} onChange={e => upd('endereco', e.target.value)} placeholder="Rua, numero, bairro, cidade — UF, CEP" />
            </div>
          </div>
        </div>

        {/* Corpo do contrato */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Corpo do contrato *</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                HTML com variaveis: <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{nome}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{cpf}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{endereco}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{data}}'}</code>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!templateId && (
                <button type="button" onClick={inserirEstruturaPadrao}
                  style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Estrutura padrao
                </button>
              )}
              <button type="button" onClick={() => setPreview(p => !p)}
                style={{ background: preview ? 'var(--avp-blue)' : 'none', border: '1px solid var(--avp-border)', color: preview ? '#fff' : 'var(--avp-text-dim)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {preview ? 'Editar' : 'Preview'}
              </button>
            </div>
          </div>

          {preview ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', color: '#111', fontSize: 14, lineHeight: 1.8, minHeight: 300 }}
              dangerouslySetInnerHTML={{ __html: substituirVaraiveis(corpoHtml, {
                nome: contratado.nome || '{{nome}}',
                cpf: contratado.cpf || '{{cpf}}',
                whatsapp: contratado.whatsapp || '{{whatsapp}}',
                email: contratado.email || '{{email}}',
                endereco: contratado.endereco || '{{endereco}}',
                data: new Date().toLocaleDateString('pt-BR'),
              }) }} />
          ) : (
            <textarea
              ref={textareaRef}
              value={corpoHtml}
              onChange={e => setCorpoHtml(e.target.value)}
              placeholder="Selecione um template acima ou clique em 'Estrutura padrao' para comecar."
              style={{ ...inputStyle, minHeight: 340, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Link href="/admin/contratos" style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '12px 22px', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Cancelar
          </Link>
          <button type="submit" disabled={salvando}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Enviando...' : 'Criar e Enviar Link'}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
