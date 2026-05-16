'use client'
import { useState } from 'react'
import PhoneInput from '@/app/components/PhoneInput'

type Gestor = {
  id: string
  nome: string
  email: string
  whatsapp: string
  ativo: boolean
  created_at: string
}

function LinkCopiavel({ label, url, desc }: { label: string; url: string; desc: string }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 4 }}>{desc}</p>
        <p style={{ fontSize: 12, color: 'var(--avp-blue)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</p>
      </div>
      <button onClick={copiar}
        style={{ background: copiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {copiado ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

const formVazio = { nome: '', email: '', whatsapp: '', senha: '' }

export default function GestoresCliente({ gestoresIniciais }: { gestoresIniciais: Gestor[] }) {
  const [gestores, setGestores] = useState<Gestor[]>(gestoresIniciais)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(formVazio)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [verSenha, setVerSenha] = useState(false)
  const [resetGestor, setResetGestor] = useState<Gestor | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [verNovaSenha, setVerNovaSenha] = useState(false)
  const [resetando, setResetando] = useState(false)

  const inputStyle: React.CSSProperties = {
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
  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--avp-text-dim)',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: 500,
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg(null)
    const res = await fetch('/api/admin/gestores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, '') }),
    })
    const data = await res.json()
    if (data.gestor) {
      setGestores(prev => [data.gestor, ...prev])
      setForm(formVazio)
      setShowModal(false)
      setMsg({ tipo: 'ok', texto: 'PRO criado com sucesso!' })
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao criar gestor.' })
    }
    setSalvando(false)
    setTimeout(() => setMsg(null), 5000)
  }

  async function excluirGestor(gestor: Gestor) {
    if (!confirm(`Excluir o PRO "${gestor.nome}" permanentemente? Isso remove o acesso dele à plataforma.`)) return
    const res = await fetch('/api/admin/gestores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gestor.id }),
    })
    if (res.ok) {
      setGestores(prev => prev.filter(g => g.id !== gestor.id))
      setMsg({ tipo: 'ok', texto: `PRO "${gestor.nome}" excluído.` })
    } else {
      setMsg({ tipo: 'err', texto: 'Erro ao excluir PRO.' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  async function redefinirSenha(e: React.FormEvent) {
    e.preventDefault()
    if (!resetGestor || novaSenha.length < 6) return
    setResetando(true)
    const res = await fetch('/api/admin/gestores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetGestor.id, senha: novaSenha }),
    })
    const data = await res.json()
    if (data.ok) {
      setMsg({ tipo: 'ok', texto: `Senha de "${resetGestor.nome}" redefinida com sucesso!` })
      setResetGestor(null)
      setNovaSenha('')
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao redefinir senha.' })
    }
    setResetando(false)
    setTimeout(() => setMsg(null), 5000)
  }

  async function toggleAtivo(gestor: Gestor) {
    const res = await fetch('/api/admin/gestores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: gestor.id, ativo: !gestor.ativo }),
    })
    const data = await res.json()
    if (data.gestor) {
      setGestores(prev => prev.map(g => g.id === gestor.id ? { ...g, ativo: !g.ativo } : g))
    }
  }

  return (
    <>
      {/* Modal Redefinir Senha */}
      {resetGestor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && (setResetGestor(null), setNovaSenha(''))}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 420, maxWidth: '95vw' }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Redefinir senha</h2>
              <button onClick={() => { setResetGestor(null); setNovaSenha('') }} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>
              Definir nova senha para <strong style={{ color: 'var(--avp-text)' }}>{resetGestor.nome}</strong>
            </p>
            <form onSubmit={redefinirSenha} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nova senha *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verNovaSenha ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }}
                    value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setVerNovaSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                    {verNovaSenha
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setResetGestor(null); setNovaSenha('') }}
                  style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={resetando || novaSenha.length < 6}
                  style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: resetando ? 0.6 : 1 }}>
                  {resetando ? 'Salvando...' : 'Salvar senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 480, maxWidth: '95vw' }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--avp-text)' }}>Novo PRO</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Nome completo" />
              </div>
              <div>
                <label style={labelStyle}>E-mail *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="gestor@email.com" />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp *</label>
                <PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
              </div>
              <div>
                <label style={labelStyle}>Senha inicial *</label>
                <div style={{ position: 'relative' }}><input type={verSenha ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required placeholder="Mínimo 6 caracteres" minLength={6} /><button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>{verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>
              </div>
              {msg && (
                <div style={{ padding: '10px 14px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13 }}>
                  {msg.texto}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Criando...' : 'Criar PRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msg && !showModal && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      {/* Links de captação */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔗 Links de Captação</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 16 }}>Envie estes links para que PROs e FREEs se cadastrem na plataforma.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <LinkCopiavel
            label="Cadastro PRO direto"
            url={typeof window !== 'undefined' ? `${window.location.origin}/captacao?direto=1&plano=pro` : '/captacao?direto=1&plano=pro'}
            desc="Cadastro rápido + pagamento PRO automático."
          />
          <LinkCopiavel
            label="Cadastro FREE (geral)"
            url={typeof window !== 'undefined' ? `${window.location.origin}/captacao?direto=1` : '/captacao?direto=1'}
            desc="Link direto para cadastro FREE sem funil."
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          + Novo PRO
        </button>
      </div>

      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
              {['Nome', 'E-mail', 'WhatsApp', 'Link FREE', 'Status', 'Cadastro', 'Ações'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gestores.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--avp-text)', fontSize: 14 }}>{g.nome}</td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{g.email}</td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{g.whatsapp}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => {
                    const url = `${window.location.origin}/g/${g.whatsapp}`
                    navigator.clipboard.writeText(url)
                  }} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Copiar link
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: g.ativo ? 'var(--avp-green)' : '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                    {g.ativo ? 'Ativo' : 'Pendente'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(g.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => toggleAtivo(g)}
                      style={{ background: g.ativo ? '#e6394620' : '#02A15320', color: g.ativo ? 'var(--avp-danger)' : 'var(--avp-green)', border: `1px solid ${g.ativo ? 'var(--avp-danger)' : 'var(--avp-green)'}`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {g.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => { setResetGestor(g); setNovaSenha('') }}
                      style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b60', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Senha
                    </button>
                    <button onClick={() => excluirGestor(g)}
                      style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {gestores.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum PRO cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}
