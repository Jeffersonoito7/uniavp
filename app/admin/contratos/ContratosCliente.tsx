'use client'
import { useState, useRef } from 'react'

type Contrato = {
  id: string; nome: string; cpf: string | null; whatsapp: string; email: string | null
  cnpj_mei: string | null; sede_mei: string | null; numero_registro: string | null
  assinado_em: string | null; hash_contrato: string | null; pdf_url: string | null; pdf_status: string | null
  clausulas_aceitas?: { sem_cnpj?: boolean } | null
}

type AlunoSemContrato = {
  id: string; nome: string; whatsapp: string; email: string | null; status: string | null
}

function mascaraCPF(cpf: string | null) {
  if (!cpf) return '—'
  const d = cpf.replace(/\D/g, '')
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf
}

function mascaraCNPJ(cnpj: string | null) {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : cnpj
}

function mascaraWpp(w: string) {
  const d = w.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  return w
}

function linkWpp(w: string) {
  const d = w.replace(/\D/g, '')
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}`
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cor: string; bg: string }> = {
    concluido:  { label: 'Formado',      cor: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    ativo:      { label: 'Em andamento', cor: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
    inativo:    { label: 'Inativo',      cor: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    pendente:   { label: 'Pendente',     cor: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  }
  const s = map[status ?? ''] ?? { label: status ?? '—', cor: 'var(--avp-text-dim)', bg: 'var(--avp-card)' }
  return (
    <span style={{ background: s.bg, color: s.cor, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

type ClausulaIA = { num: number; titulo: string; resumo: string; texto: string }

function ProcessarContratoIA({ clausulasAtuais }: { clausulasAtuais: boolean }) {
  const [etapa, setEtapa] = useState<'idle' | 'processando' | 'revisao' | 'salvando' | 'salvo'>('idle')
  const [clausulas, setClausulas] = useState<ClausulaIA[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [clausulaEdit, setClausulaEdit] = useState<ClausulaIA | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processar(file: File) {
    setEtapa('processando')
    setErro(null)
    try {
      const form = new FormData()
      form.append('arquivo', file)
      const res = await fetch('/api/admin/contratos/processar-pdf', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar PDF')
      setClausulas(data.clausulas)
      setEtapa('revisao')
    } catch (e: any) {
      setErro(e.message)
      setEtapa('idle')
    }
  }

  async function salvar() {
    setEtapa('salvando')
    setErro(null)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ chave: 'contrato_clausulas', valor: JSON.stringify(clausulas) }]),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar')
      setEtapa('salvo')
    } catch (e: any) {
      setErro(e.message)
      setEtapa('revisao')
    }
  }

  function abrirEdicao(c: ClausulaIA) {
    setEditando(c.num)
    setClausulaEdit({ ...c })
  }

  function salvarEdicao() {
    if (!clausulaEdit) return
    setClausulas(prev => prev.map(c => c.num === clausulaEdit.num ? clausulaEdit : c))
    setEditando(null)
    setClausulaEdit(null)
  }

  return (
    <div style={{ background: 'rgba(139,92,246,0.05)', border: '1.5px solid rgba(139,92,246,0.25)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: etapa === 'idle' ? 0 : 16 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: '#a78bfa' }}>
            Cláusulas via IA
            {clausulasAtuais && etapa === 'idle' && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>ativo</span>
            )}
          </p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
            {etapa === 'idle' ? 'Faça upload do seu contrato em PDF e a IA extrai as cláusulas automaticamente.' : etapa === 'processando' ? 'Analisando o contrato...' : etapa === 'revisao' ? `${clausulas.length} cláusulas extraídas — revise antes de salvar.` : etapa === 'salvando' ? 'Salvando...' : 'Cláusulas salvas! O formulário de contrato já usa os novos textos.'}
          </p>
        </div>
        {etapa === 'idle' && (
          <>
            <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) processar(f); e.target.value = '' }} />
            <button
              onClick={() => inputRef.current?.click()}
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {clausulasAtuais ? 'Atualizar contrato' : 'Upload do PDF'}
            </button>
          </>
        )}
        {etapa === 'processando' && (
          <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>Aguarde...</div>
        )}
        {etapa === 'salvo' && (
          <button
            onClick={() => { setEtapa('idle'); setClausulas([]) }}
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            Feito
          </button>
        )}
      </div>

      {erro && (
        <p style={{ fontSize: 12, color: '#f87171', margin: '0 0 12px', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>{erro}</p>
      )}

      {etapa === 'revisao' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {clausulas.map(c => (
              <div key={c.num} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{c.num}. {c.titulo}</span>
                  <button
                    onClick={() => abrirEdicao(c)}
                    style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: 'var(--avp-text-dim)', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Editar
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 4px', fontStyle: 'italic' }}>{c.resumo}</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{c.texto}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setEtapa('idle'); setClausulas([]) }}
              style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--avp-text-dim)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            >
              Salvar cláusulas
            </button>
          </div>
        </>
      )}

      {/* Modal de edição de cláusula */}
      {editando !== null && clausulaEdit && (
        <div onClick={() => setEditando(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--avp-card)', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Editar cláusula {clausulaEdit.num}</span>
              <button onClick={() => setEditando(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--avp-text-dim)' }}>×</button>
            </div>
            {(['titulo', 'resumo', 'texto'] as const).map(campo => (
              <div key={campo} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 4 }}>{campo}</label>
                <textarea
                  value={clausulaEdit[campo]}
                  onChange={e => setClausulaEdit(prev => prev ? { ...prev, [campo]: e.target.value } : prev)}
                  rows={campo === 'titulo' ? 1 : 4}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--avp-border)', background: 'var(--avp-bg)', color: 'var(--avp-text)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditando(null)} style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--avp-text-dim)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarEdicao} style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PainelEnvioContrato({ formadosSemContrato }: { formadosSemContrato: number }) {
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ enviados: number; erros: number } | null>(null)
  const [expandido, setExpandido] = useState(false)

  async function enviarParaTodos() {
    if (!confirm(`Enviar o link do contrato via WhatsApp para ${formadosSemContrato} consultor(es) formado(s) que ainda não assinaram?\n\nIsso enviará uma mensagem para cada um deles agora.`)) return
    setEnviando(true)
    setResultado(null)
    try {
      const res = await fetch('/api/admin/contratos/enviar-convite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      setResultado(data)
    } catch {
      setResultado({ enviados: 0, erros: formadosSemContrato })
    }
    setEnviando(false)
  }

  if (formadosSemContrato === 0) return null

  return (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1.5px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '18px 22px', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Enviar contrato para formados</p>
          <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '4px 0 0' }}>
            <strong style={{ color: '#818cf8' }}>{formadosSemContrato}</strong> consultor(es) formado(s) ainda nao assinaram o contrato.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setExpandido(v => !v)}
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {expandido ? 'Ocultar previa' : 'Ver mensagem'}
          </button>
          <button
            onClick={enviarParaTodos}
            disabled={enviando}
            style={{ background: enviando ? 'var(--avp-border)' : 'var(--avp-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {enviando ? 'Enviando...' : `Enviar para ${formadosSemContrato}`}
          </button>
        </div>
      </div>

      {expandido && (
        <div style={{ marginTop: 16, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px' }}>Previa da mensagem enviada</p>
          <pre style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--avp-text)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Inter, sans-serif' }}>{`Contrato de Representacao

Ola, [Nome do consultor]!

Voce concluiu o treinamento e esta apto(a) a assinar seu contrato de representacao.

Acesse o link abaixo e assine digitalmente em poucos minutos:
[link do contrato]

Apos assinar, voce recebera o PDF aqui no WhatsApp.`}</pre>
        </div>
      )}

      {resultado && (
        <div style={{ marginTop: 14, background: resultado.erros === 0 ? 'rgba(2,161,83,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${resultado.erros === 0 ? 'rgba(2,161,83,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 10, padding: '12px 16px', fontSize: 14 }}>
          {resultado.erros === 0
            ? <span style={{ color: '#22c55e', fontWeight: 700 }}>{resultado.enviados} mensagem(ns) enviada(s) com sucesso!</span>
            : <span style={{ color: '#f87171', fontWeight: 700 }}>{resultado.enviados} enviadas, {resultado.erros} com erro. Verifique se o WhatsApp esta conectado.</span>}
        </div>
      )}
    </div>
  )
}

function BotaoPDF({ contrato, onGerado }: { contrato: Contrato; onGerado: (url: string) => void }) {
  const [pdfUrl, setPdfUrl] = useState(contrato.pdf_url)
  const [status, setStatus] = useState(contrato.pdf_status)
  const [gerando, setGerando] = useState(false)

  async function gerar() {
    setGerando(true)
    setStatus('gerando')
    try {
      const res = await fetch('/api/admin/contratos/regenerar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_registro: contrato.numero_registro }),
      })
      const data = await res.json()
      if (data.pdf_url) {
        setPdfUrl(data.pdf_url)
        setStatus('gerado')
        onGerado(data.pdf_url)
      } else {
        setStatus('erro')
      }
    } catch {
      setStatus('erro')
    }
    setGerando(false)
  }

  if (pdfUrl) {
    return (
      <a href={pdfUrl} target="_blank" rel="noreferrer"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        PDF
      </a>
    )
  }

  return (
    <button
      onClick={gerar}
      disabled={gerando}
      style={{ background: gerando ? 'rgba(245,158,11,0.08)' : status === 'erro' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${status === 'erro' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, color: status === 'erro' ? '#f87171' : '#fbbf24', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: gerando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
    >
      {gerando ? 'Gerando...' : status === 'erro' ? 'Tentar novamente' : 'Gerar PDF'}
    </button>
  )
}

function GeradorLinkPersonalizado() {
  const [wpp, setWpp] = useState('')
  const [regra, setRegra] = useState('')
  const [link, setLink] = useState('')
  const [copiado, setCopiado] = useState(false)

  function gerar() {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams()
    if (wpp.replace(/\D/g,'')) params.set('wpp', wpp.replace(/\D/g,''))
    if (regra.trim()) params.set('regra', btoa(unescape(encodeURIComponent(regra.trim()))))
    setLink(`${base}/contrato?${params.toString()}`)
    setCopiado(false)
  }

  function copiar() {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) })
  }

  return (
    <div style={{ background: 'rgba(245,158,11,0.05)', border: '1.5px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
      <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 4px', color: '#fbbf24' }}>Gerar link com regra de bonificacao personalizada</p>
      <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 16px' }}>
        Use para consultores com plano de ganhos diferente do padrao. O link gerado carrega a regra no contrato desse consultor.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
            WhatsApp do consultor (opcional — para pre-preencher o formulario)
          </label>
          <input
            value={wpp} onChange={e => setWpp(e.target.value)}
            placeholder="87 99999-9999"
            style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
            Regra de bonificacao personalizada *
          </label>
          <textarea
            value={regra} onChange={e => setRegra(e.target.value)}
            placeholder={'Ex:\nR$ 100,00 por filiacao ativa, independente do numero total.\nApos atingir 300 veiculos ativos, passa a valer a tabela padrao.'}
            rows={4}
            style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
        <button
          onClick={gerar}
          disabled={!regra.trim()}
          style={{ alignSelf: 'flex-start', background: regra.trim() ? 'rgba(245,158,11,0.15)' : 'var(--avp-border)', border: `1px solid ${regra.trim() ? 'rgba(245,158,11,0.4)' : 'transparent'}`, color: regra.trim() ? '#fbbf24' : 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: regra.trim() ? 'pointer' : 'not-allowed' }}
        >
          Gerar link
        </button>
        {link && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              readOnly value={link}
              style={{ flex: 1, minWidth: 200, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
            />
            <button
              onClick={copiar}
              style={{ background: copiado ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`, color: copiado ? '#22c55e' : '#818cf8', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContratosCliente({
  contratosIniciais,
  total,
  formadosSemContrato,
  naoAssinaram,
  totalAlunos,
  temClausulasIA,
}: {
  contratosIniciais: Contrato[]
  total: number
  formadosSemContrato: number
  naoAssinaram: AlunoSemContrato[]
  totalAlunos: number
  temClausulasIA: boolean
}) {
  const [lista] = useState(contratosIniciais)
  const [naoAss] = useState(naoAssinaram)
  const [busca, setBusca] = useState('')
  const [buscaNao, setBuscaNao] = useState('')
  const [aba, setAba] = useState<'assinaram' | 'nao_assinaram'>('assinaram')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const mes = new Date()
  const esteMes = lista.filter(c => {
    if (!c.assinado_em) return false
    const d = new Date(c.assinado_em)
    return d.getMonth() === mes.getMonth() && d.getFullYear() === mes.getFullYear()
  }).length

  const comPDF = lista.filter(c => c.pdf_url).length
  const semCnpjCount = lista.filter(c => c.clausulas_aceitas?.sem_cnpj).length
  const pctAdesao = totalAlunos > 0 ? Math.round((total / totalAlunos) * 100) : 0

  const filtrada = lista.filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.numero_registro || '').includes(busca) ||
    (c.email || '').toLowerCase().includes(busca.toLowerCase()) ||
    (c.cnpj_mei || '').includes(busca.replace(/\D/g, ''))
  )

  const filtradaNao = naoAss.filter(a => {
    const matchBusca = !buscaNao ||
      a.nome.toLowerCase().includes(buscaNao.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(buscaNao.toLowerCase()) ||
      a.whatsapp.includes(buscaNao.replace(/\D/g, ''))
    const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus
    return matchBusca && matchStatus
  })

  const tabStyle = (ativo: boolean) => ({
    padding: '9px 20px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    borderBottom: ativo ? '2px solid #6366f1' : '2px solid transparent',
    background: 'none',
    color: ativo ? '#818cf8' : 'var(--avp-text-dim)',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Contratos de Representacao</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            Visao geral de assinaturas de todos os alunos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/admin/configuracoes#contrato"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Personalizar contrato
          </a>
          <a href="/contrato" target="_blank" rel="noreferrer"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Abrir pagina do contrato
          </a>
        </div>
      </div>

      <ProcessarContratoIA clausulasAtuais={temClausulasIA} />
      <PainelEnvioContrato formadosSemContrato={formadosSemContrato} />
      <GeradorLinkPersonalizado />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total de alunos', value: totalAlunos, cor: '#94a3b8' },
          { label: 'Assinaram', value: total, cor: '#22c55e' },
          { label: 'Nao assinaram', value: naoAss.length, cor: '#f87171' },
          { label: 'Adesao', value: `${pctAdesao}%`, cor: '#818cf8' },
          { label: 'Este mes', value: esteMes, cor: '#c8a535' },
          { label: 'Formados sem contrato', value: formadosSemContrato, cor: '#f59e0b' },
          { label: 'Sem CNPJ', value: semCnpjCount, cor: '#fb923c' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.cor, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ borderBottom: '1px solid var(--avp-border)', marginBottom: 20, display: 'flex', gap: 0 }}>
        <button style={tabStyle(aba === 'assinaram')} onClick={() => setAba('assinaram')}>
          Assinaram ({total})
        </button>
        <button style={tabStyle(aba === 'nao_assinaram')} onClick={() => setAba('nao_assinaram')}>
          Nao assinaram ({naoAss.length})
        </button>
      </div>

      {aba === 'assinaram' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, registro, e-mail ou CNPJ..."
              style={{ width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Registro', 'Nome', 'CPF', 'CNPJ MEI', 'WhatsApp', 'E-mail', 'Assinado em', 'PDF', 'Hash'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrada.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum resultado</td></tr>
                  ) : filtrada.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 700, fontSize: 12 }}>{c.numero_registro || '—'}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--avp-text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--avp-text-dim)', whiteSpace: 'nowrap' }}>{mascaraCPF(c.cpf)}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: 11 }}>
                        {c.clausulas_aceitas?.sem_cnpj
                          ? <span style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>Sem CNPJ</span>
                          : <span style={{ fontFamily: 'monospace', color: 'var(--avp-text-dim)' }}>{mascaraCNPJ(c.cnpj_mei)}</span>
                        }
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <a href={linkWpp(c.whatsapp)} target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>
                          {mascaraWpp(c.whatsapp)}
                        </a>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--avp-text-dim)', fontSize: 11 }}>
                        {c.assinado_em ? new Date(c.assinado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <BotaoPDF contrato={c} onGerado={(url) => {
                          c.pdf_url = url; c.pdf_status = 'gerado'
                        }} />
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: 130 }}>
                        {c.hash_contrato ? (
                          <span title={c.hash_contrato} style={{ fontFamily: 'monospace', color: 'var(--avp-text-dim)', fontSize: 10, cursor: 'help' }}>
                            {c.hash_contrato.slice(0, 12)}...
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {aba === 'nao_assinaram' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              value={buscaNao} onChange={e => setBuscaNao(e.target.value)}
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              style={{ flex: 1, minWidth: 200, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }}
            >
              <option value="todos">Todos os status</option>
              <option value="concluido">Formados</option>
              <option value="ativo">Em andamento</option>
              <option value="inativo">Inativos</option>
              <option value="pendente">Pendentes</option>
            </select>
          </div>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Nome', 'WhatsApp', 'E-mail', 'Status', 'Acao'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradaNao.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum resultado</td></tr>
                  ) : filtradaNao.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--avp-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <a href={linkWpp(a.whatsapp)} target="_blank" rel="noreferrer" style={{ color: '#22c55e', textDecoration: 'none' }}>
                          {mascaraWpp(a.whatsapp)}
                        </a>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={a.status} />
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <a
                          href={linkWpp(a.whatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                        >
                          Enviar no WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--avp-text-dim)' }}>
            Exibindo {filtradaNao.length} de {naoAss.length} aluno(s) sem contrato
          </p>
        </>
      )}
    </>
  )
}
