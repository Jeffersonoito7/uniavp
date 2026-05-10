'use client'
import { useState } from 'react'
import ImportarXLS from './ImportarXLS'

type Consultor = {
  id: string
  nome: string
  whatsapp: string
  email: string
  status: string
  created_at: string
  indicador: { nome: string } | null
  gestor_nome?: string
  gestor_whatsapp?: string
}

const statusColor: Record<string, string> = {
  ativo: '#02A153',
  pausado: '#f59e0b',
  concluido: '#333687',
  desligado: '#e63946',
}

const formVazio = { nome: '', whatsapp: '', email: '', senha: '', gestor_nome: '', gestor_whatsapp: '' }

export default function ConsultoresCliente({ consultoresIniciais }: { consultoresIniciais: Consultor[] }) {
  const [consultores, setConsultores] = useState<Consultor[]>(consultoresIniciais)
  const [showImport, setShowImport] = useState(false)
  const [showCadastro, setShowCadastro] = useState(false)
  const [busca, setBusca] = useState('')
  const [form, setForm] = useState<typeof formVazio>(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [verSenha, setVerSenha] = useState(false)

  const filtrados = consultores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  )

  async function excluirConsultor(c: Consultor) {
    if (!confirm(`Excluir "${c.nome}" permanentemente? Isso remove o acesso e todos os dados do consultor.`)) return
    const res = await fetch('/api/admin/consultores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id }),
    })
    if (res.ok) {
      setConsultores(prev => prev.filter(x => x.id !== c.id))
      setMsg({ tipo: 'ok', texto: `${c.nome} excluído com sucesso.` })
    } else {
      setMsg({ tipo: 'err', texto: 'Erro ao excluir consultor.' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-request': 'true' },
      body: JSON.stringify({
        nome: form.nome,
        whatsapp: form.whatsapp,
        email: form.email,
        senha: form.senha,
        gestor_nome: form.gestor_nome,
        gestor_whatsapp: form.gestor_whatsapp.replace(/\D/g, ''),
      }),
    })
    const data = await res.json()
    if (data.aluno) {
      setConsultores(c => [{ ...data.aluno, indicador: null }, ...c])
      setForm(formVazio)
      setShowCadastro(false)
      setMsg({ tipo: 'ok', texto: 'Consultor cadastrado com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao cadastrar.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 5000)
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12 }
  const inputStyle: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%' }
  const labelStyle: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6 }

  return (
    <>
      {showImport && <ImportarXLS onClose={() => setShowImport(false)} />}

      {showCadastro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowCadastro(false)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 520, maxWidth: '95vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--avp-text)' }}>Cadastrar Consultor</h2>
              <button onClick={() => setShowCadastro(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nome *</label>
                  <input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Nome completo" />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input style={inputStyle} value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))} required placeholder="5511999999999" />
                </div>
                <div>
                  <label style={labelStyle}>E-mail *</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label style={labelStyle}>Senha *</label>
                  <div style={{ position: 'relative' }}><input type={verSenha ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required placeholder="Mínimo 6 caracteres" minLength={6} /><button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>{verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>
                </div>
                <div>
                  <label style={labelStyle}>Nome do gestor *</label>
                  <input style={inputStyle} value={form.gestor_nome} onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value }))} required placeholder="Nome do gestor" />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp do gestor *</label>
                  <input style={inputStyle} value={form.gestor_whatsapp} onChange={e => setForm(p => ({ ...p, gestor_whatsapp: e.target.value.replace(/\D/g, '') }))} required placeholder="11999999999" />
                </div>
              </div>
              {msg && (
                <div style={{ padding: '10px 14px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13 }}>
                  {msg.texto}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowCadastro(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msg && !showCadastro && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nome, WhatsApp ou e-mail..."
          style={{ ...inputStyle, width: 280 }}
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowCadastro(true)}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            + Cadastrar Consultor
          </button>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            Importar XLS
          </button>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Nome', 'WhatsApp', 'E-mail', 'Indicador', 'Status', 'Cadastro', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text)', fontWeight: 600, fontSize: 14 }}>{c.nome}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.whatsapp}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>
                    <span style={{ color: 'var(--avp-text-dim)' }}>{c.email}</span>
                    {c.gestor_nome && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)' }}>
                        Gestor: {c.gestor_nome} · {c.gestor_whatsapp}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.indicador?.nome ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: statusColor[c.status] + '20', color: statusColor[c.status], borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => excluirConsultor(c)}
                      style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
