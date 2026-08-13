'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'

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

export default function EditarTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', descricao: '', corpo_html: '', variaveis: '', ativo: true })
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  // modo: 'visual' = editor WYSIWYG, 'html' = textarea HTML bruto, 'preview' = visualizacao final
  const [modo, setModo] = useState<'visual' | 'html' | 'preview'>('html')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [extraindo, setExtraindo] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

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

  async function extrairArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    if (form.corpo_html.trim() && !confirm('Isso vai substituir o corpo atual pelo conteudo do arquivo. Continuar?')) {
      e.target.value = ''
      return
    }
    setExtraindo(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      const res = await fetch('/api/admin/contrato-templates/extrair-arquivo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao extrair arquivo.' })
      } else {
        setForm(p => ({ ...p, corpo_html: data.html }))
        setModo('visual')
        setMsg({ tipo: 'ok', texto: `Arquivo extraido (${data.tipo.toUpperCase()}). Edite o texto diretamente e clique em Salvar.` })
      }
    } catch {
      setMsg({ tipo: 'err', texto: 'Erro de conexao ao enviar arquivo.' })
    } finally {
      setExtraindo(false)
      e.target.value = ''
    }
  }

  // Substitui variaveis no preview com valores de exemplo
  function renderPreview() {
    const variaveis = form.variaveis.split(',').map(v => v.trim()).filter(Boolean)
    const exemplos: Record<string, string> = {
      nome: 'João da Silva', cpf: '000.000.000-00', data: new Date().toLocaleDateString('pt-BR'),
      cargo: 'Consultor', empresa: 'AutoVale Prevencoes', cnpj: '00.000.000/0001-00',
      email: 'joao@email.com', whatsapp: '(11) 99999-9999', endereco: 'Rua Exemplo, 123',
      contratante_razao_social: 'AutoVale Prevencoes Ltda', contratante_cnpj: '00.000.000/0001-00',
      contratante_endereco: 'Rua Exemplo, 123, Cidade — UF', contratante_representante: 'Nome Representante',
    }
    let html = form.corpo_html
    for (const v of variaveis) {
      html = html.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), exemplos[v] ?? `[${v}]`)
    }
    return html
  }

  if (loading) return <p style={{ color: 'var(--avp-text-dim)', padding: 40, textAlign: 'center' }}>Carregando...</p>

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/contratos/templates" style={{ color: 'var(--avp-text-dim)', fontSize: 13, textDecoration: 'none' }}>← Templates</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginTop: 6 }}>Editar Template</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['visual', 'html', 'preview'] as const).map(m => (
            <button
              key={m}
              onClick={() => {
                if (m !== 'html' && modo === 'visual' && editorRef.current) {
                  setForm(p => ({ ...p, corpo_html: editorRef.current!.innerHTML }))
                }
                setModo(m)
              }}
              style={{
                background: modo === m ? 'var(--avp-blue)' : 'none',
                border: '1px solid var(--avp-border)',
                color: modo === m ? '#fff' : 'var(--avp-text-dim)',
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              {m === 'visual' ? 'Editar texto' : m === 'html' ? 'Editar HTML' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 20 }}>
          {msg.texto}
        </div>
      )}

      {modo === 'preview' ? (
        <>
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, color: '#111', fontSize: 14, lineHeight: 1.7, minHeight: 400 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderPreview()) }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, gap: 12 }}>
            <button onClick={() => setModo('visual')} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Editar texto
            </button>
          </div>
        </>
      ) : modo === 'visual' ? (
        <>
          {/* Editor WYSIWYG — o usuario edita o texto como no Word */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('bold') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontWeight: 700, color: 'var(--avp-text)', fontSize: 13 }}>N</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('italic') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontStyle: 'italic', color: 'var(--avp-text)', fontSize: 13 }}>I</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('underline') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', textDecoration: 'underline', color: 'var(--avp-text)', fontSize: 13 }}>S</button>
            <span style={{ borderLeft: '1px solid var(--avp-border)', margin: '0 4px' }} />
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('justifyLeft') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 12 }}>Esq</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('justifyCenter') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 12 }}>Centro</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); document.execCommand('justifyFull') }} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 12 }}>Justif</button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.corpo_html) }}
            style={{ background: '#fff', borderRadius: 10, padding: '28px 36px', color: '#111', fontSize: 14, lineHeight: 1.8, minHeight: 500, outline: 'none', border: '2px solid #818cf8' }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) setForm(p => ({ ...p, corpo_html: editorRef.current!.innerHTML }))
                setModo('preview')
              }}
              style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 13 }}
            >
              Ver preview
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={async () => {
                if (editorRef.current) setForm(p => ({ ...p, corpo_html: editorRef.current!.innerHTML }))
                const htmlAtual = editorRef.current?.innerHTML ?? form.corpo_html
                setSalvando(true)
                const variaveis = form.variaveis.split(',').map(v => v.trim()).filter(Boolean)
                const res = await fetch(`/api/admin/contrato-templates/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nome: form.nome, descricao: form.descricao || null, corpo_html: htmlAtual, variaveis, ativo: form.ativo }),
                })
                const data = await res.json()
                if (data.ok) setMsg({ tipo: 'ok', texto: 'Template salvo com sucesso!' })
                else setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao salvar.' })
                setSalvando(false)
                setTimeout(() => setMsg(null), 3000)
              }}
              style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}
            >
              {salvando ? 'Salvando...' : 'Salvar template'}
            </button>
          </div>
        </>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 10, flexWrap: 'wrap' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Corpo do contrato (HTML) *</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Upload de arquivo para extrair conteudo */}
                <label style={{
                  background: extraindo ? '#444' : 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: extraindo ? 'var(--avp-text-dim)' : '#818cf8',
                  borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                  cursor: extraindo ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                  {extraindo ? 'Extraindo...' : 'Carregar arquivo'}
                  <input
                    type="file"
                    accept=".docx,.pdf,.txt,.html,.htm"
                    onChange={extrairArquivo}
                    disabled={extraindo}
                    style={{ display: 'none' }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (form.corpo_html.trim() && !confirm('Isso vai substituir o corpo atual. Continuar?')) return
                    setForm(p => ({
                      ...p,
                      corpo_html: ESTRUTURA_PADRAO,
                      variaveis: 'nome, cpf, whatsapp, email, endereco, data',
                    }))
                  }}
                  style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Estrutura padrao
                </button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 8 }}>
              Formatos aceitos para upload: DOCX, PDF, TXT, HTML
            </p>
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
      </>
  )
}
