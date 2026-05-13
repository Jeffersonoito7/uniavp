'use client'
import { useState } from 'react'

type Admin = { id: string; nome: string; email: string; role: string; ativo: boolean; created_at: string; user_id: string }

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

export default function AdminsCliente({ adminsIniciais, meuUserId }: { adminsIniciais: Admin[]; meuUserId: string }) {
  const [admins, setAdmins] = useState(adminsIniciais)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [verSenha, setVerSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  // Reset de senha
  const [resetando, setResetando] = useState<Admin | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [verNovaSenha, setVerNovaSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 6, fontWeight: 500 }

  function flash(tipo: 'ok' | 'err', texto: string) {
    setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 4000)
  }

  async function criar() {
    if (!form.nome || !form.email || form.senha.length < 6) {
      flash('err', 'Preencha nome, e-mail e senha (mín. 6 caracteres).')
      return
    }
    setSalvando(true)
    const res = await fetch('/api/admin/admins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.admin) {
      setAdmins(prev => [...prev, data.admin])
      setForm({ nome: '', email: '', senha: '' })
      setShowForm(false)
      flash('ok', `Admin ${data.admin.nome} criado com sucesso!`)
    } else {
      flash('err', data.error ?? 'Erro ao criar admin.')
    }
    setSalvando(false)
  }

  async function toggleAtivo(a: Admin) {
    if (a.user_id === meuUserId) { flash('err', 'Você não pode desativar sua própria conta.'); return }
    const res = await fetch('/api/admin/admins', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, ativo: !a.ativo }),
    })
    if (res.ok) setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function excluir(a: Admin) {
    if (a.user_id === meuUserId) { flash('err', 'Você não pode excluir sua própria conta.'); return }
    if (!confirm(`Excluir admin "${a.nome}" permanentemente?`)) return
    const res = await fetch('/api/admin/admins', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    })
    const data = await res.json()
    if (data.ok) { setAdmins(prev => prev.filter(x => x.id !== a.id)); flash('ok', `${a.nome} removido.`) }
    else flash('err', data.error ?? 'Erro ao excluir.')
  }

  async function salvarSenha() {
    if (!resetando || novaSenha.length < 6) return
    setSalvandoSenha(true)
    const res = await fetch('/api/admin/admins', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetando.id, nova_senha: novaSenha }),
    })
    const data = await res.json()
    if (data.ok) {
      flash('ok', `Senha de ${resetando.nome} redefinida!`)
      setResetando(null); setNovaSenha('')
    } else flash('err', data.error ?? 'Erro ao redefinir.')
    setSalvandoSenha(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Gerentes / Admins</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
            Pessoas da empresa com acesso ao painel — {admins.length} cadastrado{admins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: showForm ? 'var(--avp-border)' : 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancelar' : '+ Adicionar gerente'}
        </button>
      </div>

      {/* Info box */}
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>👥</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#a5b4fc' }}>Quem deve ser cadastrado aqui?</p>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, lineHeight: 1.6 }}>
            Gerentes e colaboradores da <strong style={{ color: 'var(--avp-text)' }}>sua empresa</strong> que precisam logar no painel admin para cadastrar consultores, gestores, criar módulos e aulas, etc. Cada pessoa cadastrada aqui recebe login próprio e acesso completo ao painel.
          </p>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      {/* ── Formulário de criação ── */}
      {showForm && (
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Adicionar gerente</h3>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 20 }}>Esta pessoa poderá logar em <strong style={{ color: 'var(--avp-text)' }}>adm.autovaleprevencoes.org.br</strong> e terá acesso completo ao painel.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Nome completo *</label>
              <input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Maria Gerente" />
            </div>
            <div>
              <label style={lbl}>E-mail de acesso *</label>
              <input type="email" style={inp} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="gerente@suaempresa.com.br" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Senha inicial *</label>
              <div style={{ position: 'relative' }}>
                <input type={verSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }}
                  value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setVerSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                  <EyeIcon open={verSenha} />
                </button>
              </div>
            </div>
          </div>
          <div style={{ background: '#02A15315', border: '1px solid #02A15340', borderRadius: 8, padding: '12px 16px', margin: '16px 0', fontSize: 13, color: 'var(--avp-green)', lineHeight: 1.6 }}>
            ✅ Após criar, informe o <strong>e-mail</strong> e a <strong>senha</strong> para a pessoa. Ela acessa em <strong>adm.autovaleprevencoes.org.br</strong> e poderá alterar a senha depois.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
            <button onClick={criar} disabled={salvando}
              style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.7 : 1 }}>
              {salvando ? 'Criando...' : '✓ Adicionar gerente'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tabela de admins ── */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--avp-border)', background: 'var(--avp-black)' }}>
              {['Nome', 'E-mail de acesso', 'Perfil', 'Status', 'Desde', 'Ações'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14 }}>
                  {a.nome}
                  {a.user_id === meuUserId && <span style={{ marginLeft: 8, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>você</span>}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{a.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: a.role === 'super_admin' ? '#33368720' : 'var(--avp-border)', color: a.role === 'super_admin' ? '#a5b4fc' : 'var(--avp-text-dim)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                    {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: a.ativo ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, fontWeight: 700 }}>{a.ativo ? 'Ativo' : 'Inativo'}</span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '14px 16px' }}>
                  {a.user_id !== meuUserId && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => { setResetando(a); setNovaSenha(''); setVerNovaSenha(false) }}
                        style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🔑 Senha</button>
                      <button onClick={() => toggleAtivo(a)}
                        style={{ background: a.ativo ? '#f59e0b' : 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                        {a.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => excluir(a)}
                        style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🗑 Excluir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum admin cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal reset de senha ── */}
      {resetando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setResetando(null)}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 420, maxWidth: '100%' }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔑 Redefinir Senha</h2>
              <button onClick={() => setResetando(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 22 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginBottom: 20 }}>
              Nova senha para <strong style={{ color: 'var(--avp-text)' }}>{resetando.nome}</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Nova senha (mínimo 6 caracteres) *</label>
              <div style={{ position: 'relative' }}>
                <input type={verNovaSenha ? 'text' : 'password'} style={{ ...inp, paddingRight: 44 }}
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Digite a senha provisória" />
                <button type="button" onClick={() => setVerNovaSenha(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                  <EyeIcon open={verNovaSenha} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setResetando(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
              <button onClick={salvarSenha} disabled={salvandoSenha || novaSenha.length < 6}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: (salvandoSenha || novaSenha.length < 6) ? 0.6 : 1 }}>
                {salvandoSenha ? 'Salvando...' : '🔑 Redefinir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
