'use client'
import { useState, useEffect } from 'react'
import PhoneInput from '@/app/components/PhoneInput'

type Gestor = {
  id: string
  nome: string
  email: string
  whatsapp: string
  ativo: boolean
  created_at: string
  status_assinatura?: string
  plano_vencimento?: string | null
  trial_expira_em?: string | null
}

function LinkCopiavel({ label, url, desc }: { label: string; url: string; desc: string }) {
  const [copiado, setCopiado] = useState(false)
  const [fullUrl, setFullUrl] = useState(url)
  useEffect(() => { setFullUrl(`${window.location.origin}${url}`) }, [url])
  function copiar() { navigator.clipboard.writeText(fullUrl); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }
  return (
    <div style={{ background: 'var(--avp-black)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginBottom: 4 }}>{desc}</p>
        <p style={{ fontSize: 12, color: 'var(--avp-blue)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullUrl}</p>
      </div>
      <button onClick={copiar} style={{ background: copiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {copiado ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function BadgeStatus({ g }: { g: Gestor }) {
  const agora = new Date()
  const status = g.status_assinatura
  const vencido = g.plano_vencimento ? new Date(g.plano_vencimento) < agora : false
  const trialAtivo = status === 'trial' && g.trial_expira_em && new Date(g.trial_expira_em) > agora

  if (!g.ativo) return <span style={{ background: '#e6394615', color: 'var(--avp-danger)', border: '1px solid #e6394640', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Suspenso</span>
  if (status === 'ativo' && !vencido) {
    const dias = g.plano_vencimento ? Math.ceil((new Date(g.plano_vencimento).getTime() - agora.getTime()) / 86400000) : null
    return <span style={{ background: '#02A15315', color: 'var(--avp-green)', border: '1px solid #02A15340', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>PRO ativo{dias !== null ? ` · ${dias}d` : ''}</span>
  }
  if (trialAtivo) {
    const dias = Math.ceil((new Date(g.trial_expira_em!).getTime() - agora.getTime()) / 86400000)
    return <span style={{ background: '#6366f115', color: '#818cf8', border: '1px solid #6366f140', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Trial · {dias}d</span>
  }
  if (status === 'ativo' && vencido) return <span style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Vencido</span>
  return <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--avp-text-dim)', border: '1px solid var(--avp-border)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Pendente</span>
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
  const [editando, setEditando] = useState<Gestor | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', whatsapp: '', nova_senha: '' })
  // Ativação manual PRO
  const [ativandoPro, setAtivandoPro] = useState<Gestor | null>(null)
  const [diasPro, setDiasPro] = useState('30')
  const [salvandoPro, setSalvandoPro] = useState(false)

  const inp: React.CSSProperties = { background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  function flash(tipo: 'ok' | 'err', texto: string) { setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 5000) }

  async function criar(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true); setMsg(null)
    const res = await fetch('/api/admin/gestores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, '') }) })
    const data = await res.json()
    if (data.gestor) { setGestores(prev => [data.gestor, ...prev]); setForm(formVazio); setShowModal(false); flash('ok', 'PRO criado com sucesso!') }
    else flash('err', data.error ?? 'Erro ao criar gestor.')
    setSalvando(false)
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault(); if (!editando) return; setSalvando(true)
    const res = await fetch('/api/admin/gestores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editando.id, nome: editForm.nome, email: editForm.email, whatsapp: editForm.whatsapp.replace(/\D/g, ''), nova_senha: editForm.nova_senha || null }) })
    const data = await res.json()
    if (data.gestor) { setGestores(prev => prev.map(g => g.id === editando.id ? { ...g, ...data.gestor } : g)); setEditando(null); flash('ok', `${editForm.nome} atualizado!`) }
    else flash('err', data.error ?? 'Erro ao salvar.')
    setSalvando(false)
  }

  async function excluirGestor(gestor: Gestor) {
    if (!confirm(`Excluir o PRO "${gestor.nome}" permanentemente?`)) return
    const res = await fetch('/api/admin/gestores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: gestor.id }) })
    if (res.ok) { setGestores(prev => prev.filter(g => g.id !== gestor.id)); flash('ok', `"${gestor.nome}" excluído.`) }
    else flash('err', 'Erro ao excluir PRO.')
  }

  async function redefinirSenha(e: React.FormEvent) {
    e.preventDefault(); if (!resetGestor || novaSenha.length < 6) return; setResetando(true)
    const res = await fetch('/api/admin/gestores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resetGestor.id, senha: novaSenha }) })
    const data = await res.json()
    if (data.ok) { flash('ok', `Senha de "${resetGestor.nome}" redefinida!`); setResetGestor(null); setNovaSenha('') }
    else flash('err', data.error ?? 'Erro ao redefinir senha.')
    setResetando(false)
  }

  async function toggleAtivo(gestor: Gestor) {
    const res = await fetch('/api/admin/gestores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: gestor.id, ativo: !gestor.ativo }) })
    const data = await res.json()
    if (data.gestor) setGestores(prev => prev.map(g => g.id === gestor.id ? { ...g, ativo: !g.ativo } : g))
  }

  async function ativarPro(e: React.FormEvent) {
    e.preventDefault(); if (!ativandoPro) return; setSalvandoPro(true)
    const dias = parseInt(diasPro) || 30
    const res = await fetch('/api/admin/gestores/ativar-pro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gestor_id: ativandoPro.id, dias }) })
    const data = await res.json()
    if (data.ok) {
      const vencimento = data.vencimento
      setGestores(prev => prev.map(g => g.id === ativandoPro!.id ? { ...g, ativo: true, status_assinatura: 'ativo', plano_vencimento: vencimento } : g))
      flash('ok', `✅ PRO ativado por ${dias} dias para ${ativandoPro.nome}!`)
      setAtivandoPro(null)
    } else flash('err', data.error ?? 'Erro ao ativar PRO.')
    setSalvandoPro(false)
  }

  return (
    <>
      {/* Modal Ativar PRO manual */}
      {ativandoPro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setAtivandoPro(null)}>
          <div style={{ background: 'var(--avp-card)', border: '2px solid rgba(2,161,83,0.4)', borderRadius: 16, padding: 32, width: 420, maxWidth: '95vw' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--avp-green)' }}>✨ Ativar PRO Manual</h2>
              <button onClick={() => setAtivandoPro(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>
              Ativar acesso PRO para <strong style={{ color: 'var(--avp-text)' }}>{ativandoPro.nome}</strong> sem necessidade de pagamento.
            </p>
            <form onSubmit={ativarPro} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Por quantos dias?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[7, 15, 30, 60, 90].map(d => (
                    <button key={d} type="button" onClick={() => setDiasPro(String(d))}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${diasPro === String(d) ? 'var(--avp-green)' : 'var(--avp-border)'}`, background: diasPro === String(d) ? 'rgba(2,161,83,0.15)' : 'var(--avp-black)', color: diasPro === String(d) ? 'var(--avp-green)' : 'var(--avp-text-dim)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                      {d}d
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <input type="number" min={1} max={365} value={diasPro} onChange={e => setDiasPro(e.target.value)}
                    style={{ ...inp, width: 80, textAlign: 'center', fontWeight: 700 }} />
                  <span style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>dias personalizados</span>
                </div>
              </div>
              <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--avp-text-dim)' }}>
                📅 Plano vence em: <strong style={{ color: 'var(--avp-text)' }}>
                  {new Date(Date.now() + (parseInt(diasPro) || 30) * 86400000).toLocaleDateString('pt-BR')}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAtivandoPro(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvandoPro} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvandoPro ? 0.7 : 1 }}>
                  {salvandoPro ? '⏳ Ativando...' : '✅ Ativar PRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 480, maxWidth: '95vw' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>✏️ Editar PRO — {editando.nome}</h2>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Nome *</label><input style={inp} value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} required /></div>
              <div><label style={lbl}>E-mail *</label><input type="email" style={inp} value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required /></div>
              <div><label style={lbl}>WhatsApp *</label><PhoneInput value={editForm.whatsapp} onChange={v => setEditForm(p => ({ ...p, whatsapp: v }))} required style={{ background: 'var(--avp-black)', borderRadius: 8 }} /></div>
              <div><label style={lbl}>Nova senha <span style={{ fontWeight: 400 }}>(em branco = não alterar)</span></label><input type="password" style={inp} value={editForm.nova_senha} onChange={e => setEditForm(p => ({ ...p, nova_senha: e.target.value }))} placeholder="Mínimo 6 caracteres" /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditando(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>{salvando ? 'Salvando...' : '✓ Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {resetGestor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && (setResetGestor(null), setNovaSenha(''))}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 420, maxWidth: '95vw' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Redefinir senha</h2>
              <button onClick={() => { setResetGestor(null); setNovaSenha('') }} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>Nova senha para <strong style={{ color: 'var(--avp-text)' }}>{resetGestor.nome}</strong></p>
            <form onSubmit={redefinirSenha} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Nova senha *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verNovaSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setVerNovaSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                    {verNovaSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setResetGestor(null); setNovaSenha('') }} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={resetando || novaSenha.length < 6} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: resetando ? 0.6 : 1 }}>{resetando ? 'Salvando...' : 'Salvar senha'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar PRO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 480, maxWidth: '95vw' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Novo PRO</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={lbl}>Nome *</label><input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Nome completo" /></div>
              <div><label style={lbl}>E-mail *</label><input type="email" style={inp} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="pro@email.com" /></div>
              <div><label style={lbl}>WhatsApp *</label><PhoneInput value={form.whatsapp} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} required style={{ background: 'var(--avp-black)', borderRadius: 8 }} /></div>
              <div>
                <label style={lbl}>Senha inicial *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} required placeholder="Mínimo 6 caracteres" minLength={6} />
                  <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex', padding: 0 }}>
                    {verSenha ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              {msg && <div style={{ padding: '10px 14px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13 }}>{msg.texto}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>{salvando ? 'Criando...' : 'Criar PRO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msg && !showModal && !editando && !resetGestor && !ativandoPro && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🔗 Link de Captação PRO</p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 16 }}>Envie este link para novos PROs se cadastrarem na plataforma.</p>
        <LinkCopiavel label="Cadastro PRO direto" url="/captacao?direto=1&plano=pro" desc="Cadastro rápido + pagamento PRO automático." />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          + Novo PRO
        </button>
      </div>

      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Nome', 'WhatsApp', 'Plano', 'Link FREE', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gestores.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{g.nome}</p>
                    <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{g.email}</p>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{g.whatsapp}</td>
                  <td style={{ padding: '14px 16px' }}><BadgeStatus g={g} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/g/${g.whatsapp}`) }}
                      style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      Copiar link
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(g.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => { setAtivandoPro(g); setDiasPro('30') }}
                        style={{ background: 'rgba(2,161,83,0.15)', color: 'var(--avp-green)', border: '1px solid rgba(2,161,83,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ✨ Ativar PRO
                      </button>
                      <button onClick={() => { setEditForm({ nome: g.nome, email: g.email, whatsapp: g.whatsapp, nova_senha: '' }); setEditando(g) }}
                        style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✏️</button>
                      <button onClick={() => toggleAtivo(g)}
                        style={{ background: g.ativo ? '#e6394620' : '#02A15320', color: g.ativo ? 'var(--avp-danger)' : 'var(--avp-green)', border: `1px solid ${g.ativo ? '#e6394640' : '#02A15340'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {g.ativo ? '🔒' : '🔓'}
                      </button>
                      <button onClick={() => { setResetGestor(g); setNovaSenha('') }}
                        style={{ background: '#6366f120', color: '#6366f1', border: '1px solid #6366f160', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🔑</button>
                      <button onClick={() => excluirGestor(g)}
                        style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {gestores.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum PRO cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
