'use client'
import { useState } from 'react'

type Aluno = { id: string; nome: string; cpf: string | null; whatsapp: string; email: string }
type Resultado = { codigoBarras: string; pdfUrl: string; chargeId?: string }

const inp: React.CSSProperties = {
  background: 'var(--avp-black)',
  border: '1px solid var(--avp-border)',
  borderRadius: 8,
  padding: '10px 14px',
  color: 'var(--avp-text)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block',
  color: 'var(--avp-text-dim)',
  fontSize: 13,
  marginBottom: 6,
  fontWeight: 500,
}

function formatarCPFCNPJ(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length <= 11) {
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
  }
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`
}

function vencimentoPadrao() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

export default function BoletoAvulsoCliente({ alunos }: { alunos: Aluno[] }) {
  const [busca, setBusca] = useState('')
  const [alunoSel, setAlunoSel] = useState<Aluno | null>(null)
  const [mostrarLista, setMostrarLista] = useState(false)

  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(vencimentoPadrao)
  const [descricao, setDescricao] = useState('')
  const [enviarWpp, setEnviarWpp] = useState(true)

  const [gerando, setGerando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)

  const alunosFiltrados = busca.length >= 2
    ? alunos.filter(a =>
        a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        a.whatsapp.includes(busca) ||
        a.email.toLowerCase().includes(busca.toLowerCase())
      ).slice(0, 8)
    : []

  function selecionarAluno(a: Aluno) {
    setAlunoSel(a)
    setNome(a.nome)
    setCpfCnpj(a.cpf ? formatarCPFCNPJ(a.cpf) : '')
    setEmail(a.email)
    setWhatsapp(a.whatsapp)
    setBusca(a.nome)
    setMostrarLista(false)
  }

  function limparAluno() {
    setAlunoSel(null)
    setBusca('')
    setNome('')
    setCpfCnpj('')
    setEmail('')
    setWhatsapp('')
  }

  async function gerar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setResultado(null)
    setGerando(true)
    try {
      const res = await fetch('/api/admin/boleto-avulso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cpfCnpj: cpfCnpj.replace(/\D/g, ''),
          valor: Number(valor.replace(',', '.')),
          vencimento,
          descricao,
          email: email || undefined,
          whatsapp: enviarWpp && whatsapp ? whatsapp : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao gerar boleto.'); return }
      setResultado(data.boleto)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  function copiarCodigo() {
    if (!resultado) return
    navigator.clipboard.writeText(resultado.codigoBarras)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)', gap: 24, alignItems: 'start' }}>
      {/* Formulário */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 28 }}>
        <form onSubmit={gerar} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Autocomplete aluno */}
          <div style={{ position: 'relative' }}>
            <label style={lbl}>Buscar aluno cadastrado <span style={{ fontWeight: 400 }}>(opcional)</span></label>
            <input
              style={inp}
              placeholder="Digite nome, WhatsApp ou e-mail..."
              value={busca}
              onChange={e => { setBusca(e.target.value); setMostrarLista(true); if (!e.target.value) limparAluno() }}
              onFocus={() => setMostrarLista(true)}
              onBlur={() => setTimeout(() => setMostrarLista(false), 200)}
              autoComplete="off"
            />
            {mostrarLista && alunosFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                {alunosFiltrados.map(a => (
                  <button key={a.id} type="button" onMouseDown={() => selecionarAluno(a)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--avp-text)', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--avp-border)' }}>
                    <span style={{ fontWeight: 600 }}>{a.nome}</span>
                    <span style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginLeft: 8 }}>{a.whatsapp}</span>
                  </button>
                ))}
              </div>
            )}
            {alunoSel && (
              <p style={{ fontSize: 12, color: 'var(--avp-green)', marginTop: 4 }}>
                Aluno selecionado: {alunoSel.nome}
                <button type="button" onClick={limparAluno} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 11 }}>limpar</button>
              </p>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--avp-border)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Nome completo *</label>
              <input style={inp} value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome do pagador" />
            </div>
            <div>
              <label style={lbl}>CPF ou CNPJ *</label>
              <input style={inp} value={cpfCnpj} onChange={e => setCpfCnpj(formatarCPFCNPJ(e.target.value))} required placeholder="000.000.000-00" maxLength={18} inputMode="numeric" />
            </div>
            <div>
              <label style={lbl}>E-mail <span style={{ fontWeight: 400 }}>(opcional)</span></label>
              <input type="email" style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label style={lbl}>Valor (R$) *</label>
              <input style={inp} value={valor} onChange={e => setValor(e.target.value)} required placeholder="97,00" inputMode="decimal" />
            </div>
            <div>
              <label style={lbl}>Vencimento *</label>
              <input type="date" style={inp} value={vencimento} onChange={e => setVencimento(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Descrição / motivo</label>
              <input style={inp} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Plano PRO — setembro/2026" />
            </div>
          </div>

          {/* WhatsApp */}
          <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: enviarWpp ? 12 : 0 }}>
              <input type="checkbox" id="enviarWpp" checked={enviarWpp} onChange={e => setEnviarWpp(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="enviarWpp" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--avp-text)' }}>
                Enviar boleto por WhatsApp
              </label>
            </div>
            {enviarWpp && (
              <div>
                <label style={lbl}>WhatsApp (com DDD)</label>
                <input style={inp} value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  placeholder="85999999999" inputMode="numeric" maxLength={11} />
              </div>
            )}
          </div>

          {erro && (
            <div style={{ padding: '10px 14px', background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, color: 'var(--avp-danger)', fontSize: 13 }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={gerando}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 15, cursor: gerando ? 'default' : 'pointer', opacity: gerando ? 0.6 : 1 }}>
            {gerando ? 'Gerando boleto...' : 'Gerar Boleto'}
          </button>
        </form>
      </div>

      {/* Resultado */}
      <div>
        {!resultado && (
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 28, color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--avp-text)', marginBottom: 8 }}>Boleto gerado aparece aqui</p>
            <p>Preencha o formulário e clique em "Gerar Boleto".</p>
          </div>
        )}
        {resultado && (
          <div style={{ background: 'var(--avp-card)', border: '1px solid rgba(2,161,83,0.4)', borderRadius: 12, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(2,161,83,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#02A153" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--avp-green)', margin: 0 }}>Boleto gerado!</p>
                {enviarWpp && whatsapp && <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>Enviado por WhatsApp</p>}
              </div>
            </div>

            <div style={{ background: 'var(--avp-black)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--avp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Código de barras</p>
              <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--avp-text)', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>
                {resultado.codigoBarras}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={copiarCodigo}
                style={{ flex: 1, background: copiado ? 'rgba(2,161,83,0.15)' : 'var(--avp-blue)', color: copiado ? 'var(--avp-green)' : '#fff', border: copiado ? '1px solid rgba(2,161,83,0.4)' : 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {copiado ? 'Copiado!' : 'Copiar código'}
              </button>
              <a href={resultado.pdfUrl} target="_blank" rel="noreferrer"
                style={{ flex: 1, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                Abrir PDF
              </a>
            </div>

            <button onClick={() => setResultado(null)}
              style={{ marginTop: 16, width: '100%', background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>
              Gerar outro boleto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
