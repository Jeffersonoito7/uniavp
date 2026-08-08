'use client'
import { useState } from 'react'
import PhoneInput from '@/app/components/PhoneInput'

type Aluno = {
  id: string
  nome: string
  whatsapp: string
  email: string
  cpf: string | null
  status: string
  plano: 'PRO' | 'Free'
  user_id: string | null
  plano_vencimento: string | null
  gestor_nome: string | null
  created_at: string | null
  status_assinatura: string | null
}

const statusColor: Record<string, string> = {
  ativo: '#02A153',
  pausado: '#f59e0b',
  concluido: '#6366f1',
  desligado: '#e63946',
  inativo: '#e63946',
}

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
}

function BadgePlano({ plano }: { plano: 'PRO' | 'Free' }) {
  const isPro = plano === 'PRO'
  return (
    <span style={{
      background: isPro ? '#4ade8020' : '#60a5fa20',
      color: isPro ? '#4ade80' : '#60a5fa',
      border: `1px solid ${isPro ? '#4ade8040' : '#60a5fa40'}`,
      borderRadius: 20,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 700,
    }}>
      {plano}
    </span>
  )
}

export default function AlunosCliente({ alunos: alunosIniciais, buscaInicial = '' }: { alunos: Aluno[]; buscaInicial?: string }) {
  const [alunos, setAlunos] = useState<Aluno[]>(alunosIniciais)
  const [busca, setBusca] = useState(buscaInicial)
  const [filtroPlano, setFiltroPlano] = useState<'todos' | 'PRO' | 'Free'>('todos')
  const [editando, setEditando] = useState<Aluno | null>(null)
  const [editForm, setEditForm] = useState({
    nome: '', whatsapp: '', email: '', cpf: '', status: 'ativo',
    plano: 'Free' as 'PRO' | 'Free', plano_vencimento: '',
    nova_senha: '', confirmar_senha: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  function flash(tipo: 'ok' | 'err', texto: string) {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 5000)
  }

  function vencimentoPadrao() {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  function abrirEdicao(a: Aluno) {
    setEditForm({
      nome: a.nome,
      whatsapp: a.whatsapp,
      email: a.email,
      cpf: a.cpf ?? '',
      status: a.status,
      plano: a.plano,
      plano_vencimento: a.plano_vencimento ? a.plano_vencimento.split('T')[0] : vencimentoPadrao(),
      nova_senha: '',
      confirmar_senha: '',
    })
    setEditando(a)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    if (editForm.nova_senha && editForm.nova_senha.length < 6) {
      flash('err', 'A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (editForm.nova_senha && editForm.nova_senha !== editForm.confirmar_senha) {
      flash('err', 'As senhas não coincidem.')
      return
    }
    setSalvando(true)
    const body: Record<string, unknown> = {
      nome: editForm.nome,
      whatsapp: editForm.whatsapp.replace(/\D/g, ''),
      email: editForm.email,
      cpf: editForm.cpf.replace(/\D/g, '') || null,
      status: editForm.status,
      plano: editForm.plano,
      plano_vencimento: editForm.plano === 'PRO' ? editForm.plano_vencimento : null,
      ...(editForm.nova_senha ? { nova_senha: editForm.nova_senha } : {}),
    }
    const res = await fetch(`/api/admin/alunos/${editando.id}/editar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.ok) {
      setAlunos(prev => prev.map(a => a.id === editando.id ? {
        ...a,
        nome: editForm.nome,
        whatsapp: editForm.whatsapp.replace(/\D/g, ''),
        email: editForm.email,
        cpf: editForm.cpf.replace(/\D/g, '') || null,
        status: editForm.status,
        plano: editForm.plano,
        plano_vencimento: editForm.plano === 'PRO' ? editForm.plano_vencimento : null,
      } : a))
      setEditando(null)
      flash('ok', `${editForm.nome} atualizado com sucesso.`)
    } else {
      flash('err', data.error ?? 'Erro ao salvar.')
    }
    setSalvando(false)
  }

  const filtrados = alunos.filter(a => {
    const buscaOk = !busca ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.whatsapp.includes(busca) ||
      a.email.toLowerCase().includes(busca.toLowerCase())
    const planoOk = filtroPlano === 'todos' || a.plano === filtroPlano
    return buscaOk && planoOk
  })

  return (
    <>
      {/* Modal Editar */}
      {editando && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setEditando(null)}
        >
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 540, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
            onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Editar aluno: {editando.nome}</h2>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 22 }}>x</button>
            </div>
            <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Nome *</label>
                  <input style={inp} value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} required />
                </div>
                <div>
                  <label style={lbl}>WhatsApp *</label>
                  <PhoneInput value={editForm.whatsapp} onChange={v => setEditForm(p => ({ ...p, whatsapp: v }))} required style={{ background: 'var(--avp-black)', borderRadius: 8 }} />
                </div>
                <div>
                  <label style={lbl}>E-mail *</label>
                  <input type="email" style={inp} value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div>
                  <label style={lbl}>CPF</label>
                  <input style={inp} value={editForm.cpf} onChange={e => setEditForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="concluido">Formado</option>
                    <option value="desligado">Desligado</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Plano</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={editForm.plano} onChange={e => setEditForm(p => ({ ...p, plano: e.target.value as 'PRO' | 'Free', plano_vencimento: e.target.value === 'PRO' ? p.plano_vencimento || vencimentoPadrao() : p.plano_vencimento }))}>
                    <option value="Free">Free</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
              </div>

              {editForm.plano === 'PRO' && (
                <div>
                  <label style={lbl}>Vencimento do plano</label>
                  <input type="date" style={inp} value={editForm.plano_vencimento} onChange={e => setEditForm(p => ({ ...p, plano_vencimento: e.target.value }))} required />
                </div>
              )}

              {/* Alteração de senha */}
              <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 16, marginTop: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--avp-text-dim)', marginBottom: 14 }}>
                  Alterar senha (deixe em branco para manter a atual)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Nova senha</label>
                    <input
                      type="password"
                      style={inp}
                      value={editForm.nova_senha}
                      onChange={e => setEditForm(p => ({ ...p, nova_senha: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label style={lbl}>Confirmar nova senha</label>
                    <input
                      type="password"
                      style={inp}
                      value={editForm.confirmar_senha}
                      onChange={e => setEditForm(p => ({ ...p, confirmar_senha: e.target.value }))}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {msg && (
                <div style={{ padding: '10px 14px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13 }}>
                  {msg.texto}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditando(null)} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: salvando ? 0.6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {msg && !editando && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nome, WhatsApp ou e-mail..."
          style={{ ...inp, width: 320 }}
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {(['todos', 'PRO', 'Free'] as const).map(op => (
          <button
            key={op}
            onClick={() => setFiltroPlano(op)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: '1px solid',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .15s',
              ...(filtroPlano === op
                ? op === 'PRO'
                  ? { background: '#4ade8020', color: '#4ade80', borderColor: '#4ade8060' }
                  : op === 'Free'
                  ? { background: '#60a5fa20', color: '#60a5fa', borderColor: '#60a5fa60' }
                  : { background: 'var(--avp-blue)', color: '#fff', borderColor: 'var(--avp-blue)' }
                : { background: 'transparent', color: 'var(--avp-text-dim)', borderColor: 'var(--avp-border)' }
              ),
            }}
          >
            {op === 'todos' ? 'Todos' : op}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                {['Nome', 'WhatsApp', 'E-mail', 'Plano', 'Status', 'Cadastro', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>
                    {a.nome}
                    {a.gestor_nome && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 400 }}>
                        Captador: {a.gestor_nome}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{a.whatsapp}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>
                    {a.email}
                    {!a.user_id && (
                      <span style={{ display: 'inline-block', marginLeft: 6, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 6, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                        Sem acesso
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <BadgePlano plano={a.plano} />
                    {a.plano === 'PRO' && a.plano_vencimento && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--avp-text-dim)' }}>
                        até {new Date(a.plano_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: (statusColor[a.status] ?? '#888') + '20', color: statusColor[a.status] ?? '#888', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => abrirEdicao(a)}
                      style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum aluno encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
