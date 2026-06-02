'use client'
import { useState } from 'react'

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

type Acordo = { id: string; nome: string; regra_bonificacao: string; criado_em: string }

async function salvarAcordosConfig(lista: Acordo[]) {
  await fetch('/api/admin/configuracoes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ chave: 'contrato_acordos', valor: JSON.stringify(lista) }]),
  })
}

function ModelosAcordo({ acordosIniciais }: { acordosIniciais: Acordo[] }) {
  const [lista, setLista] = useState(acordosIniciais)
  const [criando, setCriando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaRegra, setNovaRegra] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState<Acordo | null>(null)

  const inp2 = { width: '100%', background: 'var(--avp-bg)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties

  async function criar() {
    if (!novoNome.trim() || !novaRegra.trim()) return
    setSalvando(true)
    const novo: Acordo = { id: crypto.randomUUID(), nome: novoNome.trim(), regra_bonificacao: novaRegra.trim(), criado_em: new Date().toISOString() }
    const novaLista = [...lista, novo]
    await salvarAcordosConfig(novaLista)
    setLista(novaLista); setNovoNome(''); setNovaRegra(''); setCriando(false); setSalvando(false)
  }

  async function deletar(id: string) {
    if (!confirm('Remover este modelo de acordo?')) return
    const novaLista = lista.filter(a => a.id !== id)
    await salvarAcordosConfig(novaLista)
    setLista(novaLista)
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    const novaLista = lista.map(a => a.id === editando.id ? editando : a)
    await salvarAcordosConfig(novaLista)
    setLista(novaLista); setEditando(null); setSalvando(false)
  }

  return (
    <div style={{ background: 'rgba(34,197,94,0.04)', border: '1.5px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: lista.length > 0 || criando ? 16 : 0 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: '#22c55e' }}>Modelos de Acordo</p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
            Salve regras de bonificacao com nome. Ao gerar um link, basta selecionar o modelo em vez de redigitar.
          </p>
        </div>
        {!criando && (
          <button onClick={() => setCriando(true)}
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            + Novo modelo
          </button>
        )}
      </div>

      {lista.length === 0 && !criando && (
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: 0 }}>
          Nenhum modelo salvo. Crie o primeiro para agilizar o envio de contratos.
        </p>
      )}

      {lista.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: criando ? 14 : 0 }}>
          {lista.map(a => (
            <div key={a.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{a.nome}</p>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {a.regra_bonificacao.slice(0, 180)}{a.regra_bonificacao.length > 180 ? '...' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditando({ ...a })}
                  style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--avp-text-dim)', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => deletar(a.id)}
                  style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#f87171', cursor: 'pointer' }}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {criando && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 5 }}>Nome do modelo *</label>
            <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Acordo Padrao AVP, Acordo Especial 200 fichas..." style={inp2} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 5 }}>Regra de bonificacao *</label>
            <textarea value={novaRegra} onChange={e => setNovaRegra(e.target.value)}
              placeholder={'Ex:\n10 filiações = R$ 500,00\n20 filiações = R$ 1.500,00\nRecorrência de 5% com 300+ veículos ativos.'}
              rows={5} style={{ ...inp2, resize: 'vertical', fontFamily: 'Inter, sans-serif' } as React.CSSProperties} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setCriando(false); setNovoNome(''); setNovaRegra('') }}
              style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--avp-text-dim)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={criar} disabled={!novoNome.trim() || !novaRegra.trim() || salvando}
              style={{ background: !novoNome.trim() || !novaRegra.trim() || salvando ? 'var(--avp-border)' : '#22c55e', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: !novoNome.trim() || !novaRegra.trim() || salvando ? 'not-allowed' : 'pointer' }}>
              {salvando ? 'Salvando...' : 'Salvar modelo'}
            </button>
          </div>
        </div>
      )}

      {editando && (
        <div onClick={() => setEditando(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--avp-card)', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Editar modelo</span>
              <button onClick={() => setEditando(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--avp-text-dim)' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 5 }}>Nome</label>
                <input value={editando.nome} onChange={e => setEditando(p => p ? { ...p, nome: e.target.value } : p)} style={inp2} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--avp-text-dim)', display: 'block', marginBottom: 5 }}>Regra de bonificacao</label>
                <textarea value={editando.regra_bonificacao} onChange={e => setEditando(p => p ? { ...p, regra_bonificacao: e.target.value } : p)}
                  rows={6} style={{ ...inp2, resize: 'vertical', fontFamily: 'Inter, sans-serif' } as React.CSSProperties} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditando(null)} style={{ border: '1px solid var(--avp-border)', background: 'transparent', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'var(--avp-text-dim)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarEdicao} disabled={!editando.nome.trim() || !editando.regra_bonificacao.trim() || salvando}
                style={{ background: '#22c55e', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
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

function GeradorLinkPersonalizado({ acordos }: { acordos: Acordo[] }) {
  const [wpp, setWpp] = useState('')
  const [regra, setRegra] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [link, setLink] = useState('')
  const [copiado, setCopiado] = useState(false)

  const inpStyle = { width: '100%', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--avp-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' } as React.CSSProperties

  function selecionarModelo(id: string) {
    setModeloId(id)
    const a = acordos.find(x => x.id === id)
    if (a) setRegra(a.regra_bonificacao)
  }

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
      <p style={{ fontWeight: 800, fontSize: 14, margin: '0 0 4px', color: '#fbbf24' }}>Gerar link de contrato</p>
      <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 16px' }}>
        Selecione um modelo salvo ou escreva a regra manualmente. O link gerado abre o contrato pre-configurado para o consultor assinar.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {acordos.length > 0 && (
          <div>
            <label style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              Usar modelo de acordo salvo
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {acordos.map(a => (
                <button key={a.id} onClick={() => selecionarModelo(modeloId === a.id ? '' : a.id)}
                  style={{ background: modeloId === a.id ? 'rgba(34,197,94,0.12)' : 'var(--avp-card)', border: `1px solid ${modeloId === a.id ? 'rgba(34,197,94,0.5)' : 'var(--avp-border)'}`, color: modeloId === a.id ? '#22c55e' : 'var(--avp-text)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: modeloId === a.id ? 700 : 400, cursor: 'pointer' }}>
                  {a.nome}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
            WhatsApp do consultor (opcional — pre-preenche o formulario)
          </label>
          <input value={wpp} onChange={e => setWpp(e.target.value)} placeholder="87 99999-9999" style={inpStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
            Regra de bonificacao {acordos.length > 0 ? '(preenchida ao selecionar modelo)' : '*'}
          </label>
          <textarea
            value={regra} onChange={e => { setRegra(e.target.value); setModeloId('') }}
            placeholder={'Ex:\nR$ 100,00 por filiacao ativa.\nApos 300 veiculos ativos, passa a valer a tabela padrao.'}
            rows={4}
            style={{ ...inpStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' } as React.CSSProperties}
          />
        </div>
        <button onClick={gerar} disabled={!regra.trim()}
          style={{ alignSelf: 'flex-start', background: regra.trim() ? 'rgba(245,158,11,0.15)' : 'var(--avp-border)', border: `1px solid ${regra.trim() ? 'rgba(245,158,11,0.4)' : 'transparent'}`, color: regra.trim() ? '#fbbf24' : 'var(--avp-text-dim)', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: regra.trim() ? 'pointer' : 'not-allowed' }}>
          Gerar link
        </button>
        {link && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input readOnly value={link}
              style={{ flex: 1, minWidth: 200, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--avp-text)', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
            />
            <button onClick={copiar}
              style={{ background: copiado ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`, color: copiado ? '#22c55e' : '#818cf8', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PainelSemCnpj({ contratos }: { contratos: Contrato[] }) {
  const [expandido, setExpandido] = useState(false)
  const lista = contratos.filter(c => c.clausulas_aceitas?.sem_cnpj)
  if (lista.length === 0) return null

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const linkContrato = `${base}/contrato`

  function msgCobrar(nome: string) {
    const primeiro = nome.trim().split(' ')[0]
    return encodeURIComponent(
      `Ola, ${primeiro}! Seu contrato de representacao foi assinado sem o CNPJ MEI.\n\nAssim que abrir sua empresa, acesse o link abaixo para assinar novamente com os dados atualizados:\n${linkContrato}\n\nQualquer duvida, estamos aqui!`
    )
  }

  return (
    <div style={{ background: 'rgba(251,146,60,0.06)', border: '1.5px solid rgba(251,146,60,0.3)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: '#fb923c' }}>
            Contratos sem CNPJ — revisao pendente
          </p>
          <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>
            <strong style={{ color: '#fb923c' }}>{lista.length}</strong> consultor(es) assinaram sem CNPJ MEI. Quando abrirem empresa, solicite novo contrato.
          </p>
        </div>
        <button onClick={() => setExpandido(v => !v)}
          style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.35)', color: '#fb923c', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {expandido ? 'Ocultar lista' : `Ver os ${lista.length}`}
        </button>
      </div>

      {expandido && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map(c => {
            const wppNum = c.whatsapp.replace(/\D/g, '')
            const wppHref = `https://wa.me/${wppNum.startsWith('55') ? wppNum : '55' + wppNum}?text=${msgCobrar(c.nome)}`
            return (
              <div key={c.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{c.nome}</p>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                    {mascaraWpp(c.whatsapp)}
                    {c.assinado_em && (
                      <> &middot; assinou em {new Date(c.assinado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</>
                    )}
                  </p>
                </div>
                <a href={wppHref} target="_blank" rel="noreferrer"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Cobrar via WhatsApp
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ContratosCliente({
  contratosIniciais,
  total,
  formadosSemContrato,
  naoAssinaram,
  totalAlunos,
  acordos,
}: {
  contratosIniciais: Contrato[]
  total: number
  formadosSemContrato: number
  naoAssinaram: AlunoSemContrato[]
  totalAlunos: number
  acordos: Acordo[]
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

      <ModelosAcordo acordosIniciais={acordos} />
      <PainelEnvioContrato formadosSemContrato={formadosSemContrato} />
      <GeradorLinkPersonalizado acordos={acordos} />
      <PainelSemCnpj contratos={lista} />

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
