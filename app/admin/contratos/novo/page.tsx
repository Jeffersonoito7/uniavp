'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminLayout from '../../AdminLayout'
import PhoneInput from '@/app/components/PhoneInput'
import Link from 'next/link'

type Template = { id: string; nome: string; variaveis: string[]; corpo_html: string }
type ContratoBase = { id: string; titulo: string; numero_registro: string }
type Perfil = { id: string; nome: string; cnpj: string; endereco: string; representante: string; cargo: string }

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
  <p style="margin-bottom:4px;"><strong>Razão Social:</strong> {{contratante_razao_social}}</p>
  <p style="margin-bottom:4px;"><strong>CNPJ:</strong> {{contratante_cnpj}}</p>
  <p style="margin-bottom:4px;"><strong>Endereço:</strong> {{contratante_endereco}}</p>
  <p style="margin-bottom:20px;"><strong>Representante Legal:</strong> {{contratante_representante}}</p>

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

const PERFIL_VAZIO: Perfil = { id: '', nome: '', cnpj: '', endereco: '', representante: '', cargo: '' }

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

  // Contratante
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [perfilId, setPerfilId] = useState<string>('manual')
  const [contratante, setContratante] = useState(PERFIL_VAZIO)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState('')
  const [editandoPerfil, setEditandoPerfil] = useState(false)

  // Contratado
  const [contratado, setContratado] = useState({ nome: '', cpf: '', whatsapp: '', email: '', endereco: '' })
  const [contratadoPreenche, setContratadoPreenche] = useState(false)

  useEffect(() => {
    fetch('/api/admin/contrato-templates?com_corpo=1')
      .then(r => r.json()).then(d => setTemplates(d.templates ?? []))
    fetch('/api/admin/contratantes')
      .then(r => r.json()).then(d => {
        const lista: Perfil[] = d.perfis ?? []
        setPerfis(lista)
        if (lista.length > 0) {
          setPerfilId(lista[0].id)
          setContratante(lista[0])
        }
      })
  }, [])

  useEffect(() => {
    if (!baseId) return
    fetch(`/api/admin/contratos-digitais/${baseId}`)
      .then(r => r.json()).then(d => {
        if (d.contrato) {
          setContratoBase(d.contrato)
          setTitulo(`Aditivo — ${d.contrato.titulo}`)
          if (d.contrato.corpo_renderizado) setCorpoHtml(d.contrato.corpo_renderizado)
          if (d.contrato.assinantes?.length > 0) {
            const a = d.contrato.assinantes[0]
            setContratado({ nome: a.nome ?? '', cpf: a.cpf ?? '', whatsapp: a.whatsapp ?? '', email: a.email ?? '', endereco: '' })
          }
        }
      })
  }, [baseId])

  function selecionarPerfil(id: string) {
    setPerfilId(id)
    if (id === 'manual') {
      setContratante(PERFIL_VAZIO)
      setEditandoPerfil(true)
    } else if (id === 'novo') {
      setContratante(PERFIL_VAZIO)
      setEditandoPerfil(true)
      setPerfilId('novo')
    } else {
      const p = perfis.find(p => p.id === id)
      if (p) { setContratante(p); setEditandoPerfil(false) }
    }
    setMsgPerfil('')
  }

  function updContratante(campo: keyof Perfil, valor: string) {
    setContratante(p => ({ ...p, [campo]: valor }))
  }

  async function salvarPerfil() {
    if (!contratante.nome.trim()) { setMsgPerfil('Informe a razão social.'); return }
    setSalvandoPerfil(true)
    setMsgPerfil('')
    try {
      if (perfilId !== 'manual' && perfilId !== 'novo' && perfilId !== '') {
        // Atualiza perfil existente
        const res = await fetch('/api/admin/contratantes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...contratante, id: perfilId }),
        })
        const d = await res.json()
        if (d.ok) {
          setPerfis(prev => prev.map(p => p.id === perfilId ? contratante : p))
          setMsgPerfil('Perfil atualizado.')
          setEditandoPerfil(false)
        } else { setMsgPerfil(d.error ?? 'Erro ao atualizar.') }
      } else {
        // Cria novo perfil
        const res = await fetch('/api/admin/contratantes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contratante),
        })
        const d = await res.json()
        if (d.ok && d.perfil) {
          setPerfis(prev => [...prev, d.perfil])
          setPerfilId(d.perfil.id)
          setContratante(d.perfil)
          setMsgPerfil('Perfil salvo.')
          setEditandoPerfil(false)
        } else { setMsgPerfil(d.error ?? 'Erro ao salvar.') }
      }
    } finally { setSalvandoPerfil(false) }
  }

  async function excluirPerfil() {
    if (!perfilId || perfilId === 'manual' || perfilId === 'novo') return
    if (!confirm('Excluir este perfil de contratante?')) return
    await fetch(`/api/admin/contratantes?id=${perfilId}`, { method: 'DELETE' })
    const novos = perfis.filter(p => p.id !== perfilId)
    setPerfis(novos)
    setPerfilId(novos.length > 0 ? novos[0].id : 'manual')
    setContratante(novos.length > 0 ? novos[0] : PERFIL_VAZIO)
    setEditandoPerfil(novos.length === 0)
  }

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
    if (!corpoHtml.trim()) { setMsg({ tipo: 'err', texto: 'O corpo do contrato não pode estar vazio.' }); return }
    if (!contratadoPreenche && !contratado.nome.trim()) { setMsg({ tipo: 'err', texto: 'Informe o nome do contratado.' }); return }
    if (!contratado.whatsapp && !contratado.email) { setMsg({ tipo: 'err', texto: 'Informe WhatsApp ou e-mail do contratado para envio do link.' }); return }

    setSalvando(true)
    setMsg(null)

    const variaveis: Record<string, string> = {
      nome: contratadoPreenche ? '' : contratado.nome.trim(),
      cpf: contratado.cpf.trim(),
      whatsapp: contratado.whatsapp.trim(),
      email: contratado.email.trim(),
      endereco: contratado.endereco.trim(),
      data: new Date().toLocaleDateString('pt-BR'),
      contratante_razao_social: contratante.nome,
      contratante_cnpj: contratante.cnpj,
      contratante_endereco: contratante.endereco,
      contratante_representante: contratante.representante,
      contratante_cargo: contratante.cargo,
    }

    const res = await fetch('/api/admin/contratos-digitais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId || null,
        titulo,
        tipo,
        contrato_base_id: baseId || null,
        ...(templateId
          ? { variaveis_usadas: variaveis }
          : { corpo_html_avulso: substituirVariaveis(corpoHtml, variaveis), variaveis_usadas: variaveis }
        ),
        assinantes: [{
          papel: 'contratado',
          nome: contratadoPreenche ? null : (contratado.nome.trim() || null),
          email: contratado.email.trim() || null,
          whatsapp: contratado.whatsapp.replace(/\D/g, '') || null,
          cpf: contratado.cpf.replace(/\D/g, '') || null,
          destinatario_preenche: contratadoPreenche,
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

  function substituirVariaveis(html: string, vars: Record<string, string>) {
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
            Preencha os dados e o corpo do contrato. O link de assinatura é enviado automaticamente por WhatsApp.
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
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Identificação</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título do contrato *</label>
              <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Contrato de Representação — Consultor" required />
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

        {/* Dados do Contratante */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Dados da Contratante</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 3 }}>
                Preenchem automaticamente <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{contratante_razao_social}}'}</code> e demais variáveis.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {perfis.length > 0 && !editandoPerfil && perfilId !== 'manual' && perfilId !== 'novo' && (
                <>
                  <button type="button" onClick={() => setEditandoPerfil(true)}
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Editar
                  </button>
                  <button type="button" onClick={excluirPerfil}
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Seletor de perfil */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Perfil da contratante</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={perfilId} onChange={e => selecionarPerfil(e.target.value)}>
              {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              <option value="novo">+ Novo perfil</option>
              {perfis.length === 0 && <option value="manual">Preencher manualmente</option>}
            </select>
          </div>

          {/* Campos do perfil */}
          {(editandoPerfil || perfilId === 'manual' || perfilId === 'novo' || perfis.length === 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Razão social *</label>
                  <input style={inputStyle} value={contratante.nome} onChange={e => updContratante('nome', e.target.value)} placeholder="Nome ou razão social da empresa" />
                </div>
                <div>
                  <label style={labelStyle}>CNPJ</label>
                  <input style={inputStyle} value={contratante.cnpj} onChange={e => updContratante('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Endereço</label>
                  <input style={inputStyle} value={contratante.endereco} onChange={e => updContratante('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade/UF, CEP" />
                </div>
                <div>
                  <label style={labelStyle}>Representante legal</label>
                  <input style={inputStyle} value={contratante.representante} onChange={e => updContratante('representante', e.target.value)} placeholder="Nome do representante" />
                </div>
                <div>
                  <label style={labelStyle}>Cargo</label>
                  <input style={inputStyle} value={contratante.cargo} onChange={e => updContratante('cargo', e.target.value)} placeholder="Diretor, Presidente..." />
                </div>
              </div>
              {msgPerfil && (
                <p style={{ fontSize: 13, color: msgPerfil.includes('salvo') || msgPerfil.includes('atualizado') ? 'var(--avp-green)' : '#f87171', margin: 0 }}>{msgPerfil}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={salvarPerfil} disabled={salvandoPerfil}
                  style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: salvandoPerfil ? 0.5 : 1 }}>
                  {salvandoPerfil ? 'Salvando...' : perfilId !== 'manual' && perfilId !== 'novo' && perfilId !== '' ? 'Atualizar perfil' : 'Salvar como perfil'}
                </button>
                {editandoPerfil && perfilId !== 'manual' && perfilId !== 'novo' && (
                  <button type="button" onClick={() => { setEditandoPerfil(false); const p = perfis.find(x => x.id === perfilId); if (p) setContratante(p) }}
                    style={{ background: 'transparent', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: 'var(--avp-black)', borderRadius: 8, padding: 16 }}>
              {contratante.nome && <div><p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Razão social</p><p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{contratante.nome}</p></div>}
              {contratante.cnpj && <div><p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>CNPJ</p><p style={{ fontSize: 14, margin: 0 }}>{contratante.cnpj}</p></div>}
              {contratante.representante && <div><p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Representante</p><p style={{ fontSize: 14, margin: 0 }}>{contratante.representante}</p></div>}
              {contratante.cargo && <div><p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Cargo</p><p style={{ fontSize: 14, margin: 0 }}>{contratante.cargo}</p></div>}
              {contratante.endereco && <div style={{ gridColumn: '1 / -1' }}><p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Endereço</p><p style={{ fontSize: 14, margin: 0 }}>{contratante.endereco}</p></div>}
            </div>
          )}
        </div>

        {/* Dados do Contratado */}
        <div style={card}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 12px' }}>Dados do Contratado</p>

            {/* Toggle: contratado preenche */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: contratadoPreenche ? 'rgba(99,102,241,0.08)' : 'var(--avp-black)', border: `1px solid ${contratadoPreenche ? 'rgba(99,102,241,0.3)' : 'var(--avp-border)'}`, borderRadius: 10, padding: '12px 16px', transition: 'all 0.15s' }}>
              <button
                type="button"
                onClick={() => setContratadoPreenche(p => !p)}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: contratadoPreenche ? 'var(--avp-accent)' : 'var(--avp-border)', position: 'relative', transition: 'background 0.2s' }}
              >
                <span style={{ position: 'absolute', top: 3, left: contratadoPreenche ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: contratadoPreenche ? '#818cf8' : 'var(--avp-text)' }}>
                  O contratado preenche os próprios dados pelo link
                </p>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                  {contratadoPreenche
                    ? 'Ao abrir o link, o contratado vai preencher nome, CPF e endereço antes de assinar.'
                    : 'O admin preenche todos os dados do contratado agora.'}
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {!contratadoPreenche && (
              <>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input style={inputStyle} value={contratado.nome} onChange={e => upd('nome', e.target.value)} placeholder="Nome completo" />
                </div>
                <div>
                  <label style={labelStyle}>CPF</label>
                  <input style={inputStyle} value={contratado.cpf} onChange={e => upd('cpf', e.target.value)} placeholder="000.000.000-00" />
                </div>
              </>
            )}
            <div>
              <label style={labelStyle}>WhatsApp {!contratadoPreenche ? '' : '*'}</label>
              <PhoneInput value={contratado.whatsapp} onChange={v => upd('whatsapp', v)} style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
            </div>
            <div>
              <label style={labelStyle}>E-mail (para receber cópia assinada)</label>
              <input type="email" style={inputStyle} value={contratado.email} onChange={e => upd('email', e.target.value)} placeholder="email@exemplo.com" />
            </div>
            {!contratadoPreenche && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Endereço</label>
                <input style={inputStyle} value={contratado.endereco} onChange={e => upd('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade/UF, CEP" />
              </div>
            )}
          </div>

          {contratadoPreenche && (
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 12, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '10px 14px' }}>
              O link enviado abrirá uma tela onde o contratado preenche nome, CPF e endereço. O contrato é atualizado automaticamente com os dados antes da assinatura.
            </p>
          )}
        </div>

        {/* Corpo do contrato */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Corpo do contrato *</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                HTML com variáveis: <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{nome}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{cpf}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{contratante_razao_social}}'}</code> <code style={{ background: 'var(--avp-black)', padding: '1px 5px', borderRadius: 4 }}>{'{{data}}'}</code>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!templateId && (
                <button type="button" onClick={inserirEstruturaPadrao}
                  style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Estrutura padrão
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
              dangerouslySetInnerHTML={{ __html: substituirVariaveis(corpoHtml, {
                nome: contratado.nome || '{{nome}}',
                cpf: contratado.cpf || '{{cpf}}',
                whatsapp: contratado.whatsapp || '{{whatsapp}}',
                email: contratado.email || '{{email}}',
                endereco: contratado.endereco || '{{endereco}}',
                data: new Date().toLocaleDateString('pt-BR'),
                contratante_razao_social: contratante.nome || '{{contratante_razao_social}}',
                contratante_cnpj: contratante.cnpj || '{{contratante_cnpj}}',
                contratante_endereco: contratante.endereco || '{{contratante_endereco}}',
                contratante_representante: contratante.representante || '{{contratante_representante}}',
                contratante_cargo: contratante.cargo || '{{contratante_cargo}}',
              }) }} />
          ) : (
            <textarea
              ref={textareaRef}
              value={corpoHtml}
              onChange={e => setCorpoHtml(e.target.value)}
              placeholder="Selecione um template acima ou clique em 'Estrutura padrão' para começar."
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
