'use client'
import { useState } from 'react'

type Consultor = { id: string; nome: string; whatsapp: string; email: string; status: string; created_at: string; gestor_nome?: string; gestor_whatsapp?: string; user_id: string }
type Gestor = { id: string; nome: string; email: string; whatsapp: string; ativo: boolean; created_at: string; user_id: string }

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

const statusCor: Record<string, string> = { ativo: '#02A153', pausado: '#f59e0b', concluido: '#333687', desligado: '#e63946' }

export default function UsuariosCliente({ consultoresIniciais, gestoresIniciais }: { consultoresIniciais: Consultor[]; gestoresIniciais: Gestor[] }) {
  const [aba, setAba] = useState<'consultores' | 'gestores'>('consultores')
  const [consultores, setConsultores] = useState(consultoresIniciais)
  const [gestores, setGestores] = useState(gestoresIniciais)
  const [busca, setBusca] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Modal de edição
  const [editando, setEditando] = useState<{ tipo: 'consultor' | 'gestor'; dado: Consultor | Gestor } | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', email: '', whatsapp: '', status: 'ativo', gestor_nome: '', gestor_whatsapp: '' })
  const [salvando, setSalvando] = useState(false)

  // Modal de reset de senha
  const [resetando, setResetando] = useState<{ user_id: string; nome: string } | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [resetando_, setResetando_] = useState(false)

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  function flash(tipo: 'ok' | 'err', texto: string) {
    setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 4000)
  }

  function abrirEdicao(tipo: 'consultor' | 'gestor', dado: Consultor | Gestor) {
    setEditando({ tipo, dado })
    if (tipo === 'consultor') {
      const c = dado as Consultor
      setEditForm({ nome: c.nome, email: c.email, whatsapp: c.whatsapp, status: c.status, gestor_nome: c.gestor_nome ?? '', gestor_whatsapp: c.gestor_whatsapp ?? '' })
    } else {
      const g = dado as Gestor
      setEditForm({ nome: g.nome, email: g.email, whatsapp: g.whatsapp, status: g.ativo ? 'ativo' : 'inativo', gestor_nome: '', gestor_whatsapp: '' })
    }
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    if (editando.tipo === 'consultor') {
      const res = await fetch('/api/admin/consultores', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editando.dado.id, nome: editForm.nome, email: editForm.email, whatsapp: editForm.whatsapp.replace(/\D/g, ''), status: editForm.status, gestor_nome: editForm.gestor_nome, gestor_whatsapp: editForm.gestor_whatsapp }),
      })
      const data = await res.json()
      if (data.aluno) {
        setConsultores(prev => prev.map(c => c.id === editando.dado.id ? { ...c, ...data.aluno } : c))
        setEditando(null); flash('ok', 'Consultor atualizado!')
      } else flash('err', data.error ?? 'Erro ao salvar.')
    } else {
      const res = await fetch('/api/admin/gestores', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editando.dado.id, nome: editForm.nome, email: editForm.email, whatsapp: editForm.whatsapp, ativo: editForm.status === 'ativo' }),
      })
      const data = await res.json()
      if (data.gestor) {
        setGestores(prev => prev.map(g => g.id === editando.dado.id ? { ...g, ...data.gestor } : g))
        setEditando(null); flash('ok', 'Gestor atualizado!')
      } else flash('err', data.error ?? 'Erro ao salvar.')
    }
    setSalvando(false)
  }

  async function resetarSenha() {
    if (!resetando || !novaSenha || novaSenha.length < 6) return
    setResetando_(true)
    const res = await fetch('/api/admin/resetar-senha', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: resetando.user_id, nova_senha: novaSenha }),
    })
    const data = await res.json()
    if (data.ok) {
      setResetando(null); setNovaSenha(''); flash('ok', `Senha de ${resetando.nome} redefinida com sucesso!`)
    } else flash('err', data.error ?? 'Erro ao redefinir senha.')
    setResetando_(false)
  }

  async function excluirConsultor(c: Consultor) {
    if (!confirm(`Excluir "${c.nome}" permanentemente?`)) return
    const res = await fetch('/api/admin/consultores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
    if (res.ok) { setConsultores(prev => prev.filter(x => x.id !== c.id)); flash('ok', `${c.nome} excluído.`) }
    else flash('err', 'Erro ao excluir.')
  }

  async function excluirGestor(g: Gestor) {
    if (!confirm(`Excluir "${g.nome}" permanentemente?`)) return
    const res = await fetch('/api/admin/gestores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: g.id }) })
    if (res.ok) { setGestores(prev => prev.filter(x => x.id !== g.id)); flash('ok', `${g.nome} excluído.`) }
    else flash('err', 'Erro ao excluir.')
  }

  async function toggleGestor(g: Gestor) {
    const res = await fetch('/api/admin/gestores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: g.id, ativo: !g.ativo }) })
    const data = await res.json()
    if (data.gestor) setGestores(prev => prev.map(x => x.id === g.id ? { ...x, ativo: !x.ativo } : x))
  }

  const filtrarConsultores = consultores.filter(c => [c.nome, c.whatsapp, c.email, c.gestor_nome ?? ''].some(v => v.toLowerCase().includes(busca.toLowerCase())))
  const filtrarGestores = gestores.filter(g => [g.nome, g.whatsapp, g.email].some(v => v.toLowerCase().includes(busca.toLowerCase())))

  const btnAcao = (label: string, onClick: () => void, cor = 'var(--avp-blue)') => (
    <button onClick={onClick} style={{ background: cor, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const }}>{label}</button>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Usuários</h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Gerencie todos os cadastros — edite dados e redefina senhas</p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--avp-border)', marginBottom: 20 }}>
        {([['consultores', `👥 Consultores (${consultores.length})`], ['gestores', `🧑‍💼 Gestores (${gestores.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => { setAba(id); setBusca('') }}
            style={{ background: 'none', border: 'none', borderBottom: `3px solid ${aba === id ? 'var(--avp-blue)' : 'transparent'}`, marginBottom: -2, padding: '10px 20px', cursor: 'pointer', fontWeight: aba === id ? 700 : 500, fontSize: 14, color: aba === id ? 'var(--avp-text)' : 'var(--avp-text-dim)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Buscar por nome, WhatsApp ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)}
          style={{ ...inp, maxWidth: 380 }} />
      </div>

      {/* ── ABA CONSULTORES ── */}
      {aba === 'consultores' && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'var(--avp-black)' }}>
                  {['Nome', 'WhatsApp', 'E-mail / Gestor', 'Status', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrarConsultores.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 14 }}>{c.nome}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{c.whatsapp}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      <span style={{ color: 'var(--avp-text-dim)' }}>{c.email}</span>
                      {c.gestor_nome && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--avp-text-dim)' }}>Gestor: {c.gestor_nome}</p>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: (statusCor[c.status] ?? '#8a8fa3') + '20', color: statusCor[c.status] ?? '#8a8fa3', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {btnAcao('✏️ Editar', () => abrirEdicao('consultor', c), 'var(--avp-blue)')}
                        {btnAcao('🔑 Senha', () => { setResetando({ user_id: c.user_id, nome: c.nome }); setNovaSenha(''); setVerSenha(false) }, '#6366f1')}
                        {btnAcao('🗑 Excluir', () => excluirConsultor(c), 'var(--avp-danger)')}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrarConsultores.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA GESTORES ── */}
      {aba === 'gestores' && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'var(--avp-black)' }}>
                  {['Nome', 'E-mail', 'WhatsApp', 'Status', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrarGestores.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 14 }}>{g.nome}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{g.email}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{g.whatsapp}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: g.ativo ? '#02A15320' : '#f59e0b20', color: g.ativo ? 'var(--avp-green)' : '#f59e0b', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {g.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(g.created_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {btnAcao('✏️ Editar', () => abrirEdicao('gestor', g), 'var(--avp-blue)')}
                        {btnAcao('🔑 Senha', () => { setResetando({ user_id: g.user_id, nome: g.nome }); setNovaSenha(''); setVerSenha(false) }, '#6366f1')}
                        {btnAcao(g.ativo ? 'Desativar' : 'Ativar', () => toggleGestor(g), g.ativo ? '#f59e0b' : 'var(--avp-green)')}
                        {btnAcao('🗑 Excluir', () => excluirGestor(g), 'var(--avp-danger)')}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrarGestores.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum gestor encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setEditando(null)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 520, maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                ✏️ Editar {editando.tipo === 'consultor' ? 'Consultor' : 'Gestor'}
              </h2>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 22 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>Nome *</label><input style={inp} value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} /></div>
                <div><label style={lbl}>WhatsApp *</label><input style={inp} value={editForm.whatsapp} onChange={e => setEditForm(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '') }))} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>E-mail *</label><input type="email" style={inp} value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
                {editando.tipo === 'consultor' ? (
                  <>
                    <div>
                      <label style={lbl}>Status</label>
                      <select style={inp} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                        <option value="ativo">Ativo</option>
                        <option value="pausado">Pausado</option>
                        <option value="concluido">Concluído</option>
                        <option value="desligado">Desligado</option>
                      </select>
                    </div>
                    <div><label style={lbl}>Nome do Gestor</label><input style={inp} value={editForm.gestor_nome} onChange={e => setEditForm(p => ({ ...p, gestor_nome: e.target.value }))} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>WhatsApp do Gestor</label><input style={inp} value={editForm.gestor_whatsapp} onChange={e => setEditForm(p => ({ ...p, gestor_whatsapp: e.target.value.replace(/\D/g, '') }))} /></div>
                  </>
                ) : (
                  <div>
                    <label style={lbl}>Status</label>
                    <select style={inp} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setEditando(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button onClick={salvarEdicao} disabled={salvando} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : '✓ Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RESETAR SENHA ── */}
      {resetando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setResetando(null)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 420, maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔑 Redefinir Senha</h2>
              <button onClick={() => setResetando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 22 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>
              Definindo nova senha para <strong style={{ color: 'var(--avp-text)' }}>{resetando.nome}</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Nova senha (mínimo 6 caracteres) *</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }} value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)} placeholder="Digite a senha provisória" />
                <button type="button" onClick={() => setVerSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', padding: 0, display: 'flex' }}>
                  <EyeIcon open={verSenha} />
                </button>
              </div>
            </div>
            <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#f59e0b' }}>⚠️ Após redefinir, informe a nova senha ao usuário. Ele poderá alterá-la depois nas configurações do perfil.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setResetando(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button onClick={resetarSenha} disabled={resetando_ || novaSenha.length < 6}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: (resetando_ || novaSenha.length < 6) ? 0.6 : 1 }}>
                {resetando_ ? 'Redefinindo...' : '🔑 Redefinir senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
