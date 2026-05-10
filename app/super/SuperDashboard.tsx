'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Cliente = { id: string; nome: string; dominio: string; ativo: boolean; contato_nome: string; contato_whatsapp: string; contato_email: string; observacoes: string; created_at: string; gestor_ativo: boolean; limite_consultores: number }
type Stats = { totalAlunos: number; totalGestores: number; totalAdmins: number; totalModulos: number; totalAulas: number }

const BASE_URL = 'https://universidade.oito7digital.com.br'

export default function SuperDashboard({ nome, clientes: inicial, stats, recentesAlunos }: {
  nome: string; clientes: Cliente[]; stats: Stats; recentesAlunos: { nome: string; created_at: string; status: string }[]
}) {
  const [clientes, setClientes] = useState<Cliente[]>(inicial)
  const [aba, setAba] = useState<'dashboard' | 'clientes' | 'novo' | 'testar' | 'cobranca'>('dashboard')
  const [isMobile, setIsMobile] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [colapsada, setColapsada] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => { if (isMobile) setMenuAberto(false) }, [aba, isMobile])
  const [tipoNovo, setTipoNovo] = useState<'' | 'empresa' | 'gestor' | 'consultor'>('')
  const [cobrancaClienteId, setCobrancaClienteId] = useState<string | null>(null)
  const [gerandoPix, setGerandoPix] = useState<string | null>(null)
  const [cobrancaMsg, setCobrancaMsg] = useState('')
  const [registrandoWebhook, setRegistrandoWebhook] = useState(false)
  const [whatsappTeste, setWhatsappTeste] = useState('')
  const [form, setForm] = useState({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [editando, setEditando] = useState<Cliente | null>(null)

  async function sair() {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await sb.auth.signOut()
    window.location.href = '/super/login'
  }

  async function salvarCliente() {
    if (!form.nome) { setMsg('Informe o nome do cliente.'); return }
    setSalvando(true); setMsg('')
    const res = await fetch('/api/super/clientes', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando ? { ...form, id: editando.id } : form),
    })
    const data = await res.json()
    if (res.ok) {
      if (editando) setClientes(prev => prev.map(c => c.id === editando.id ? data : c))
      else setClientes(prev => [...prev, data])
      setForm({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 })
      setEditando(null)
      setTipoNovo('')
      setAba('clientes')
      setMsg('Cliente salvo!')
    } else setMsg(`Erro: ${data.error || res.status}`)
    setSalvando(false)
  }

  async function toggleAtivo(c: Cliente) {
    await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ativo: !c.ativo }) })
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function excluirCliente(c: Cliente) {
    if (!confirm(`Excluir "${c.nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
    const res = await fetch('/api/super/clientes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
    if (res.ok) setClientes(prev => prev.filter(x => x.id !== c.id))
    else alert('Erro ao excluir.')
  }

  function iniciarEdicao(c: Cliente) {
    setForm({ nome: c.nome, dominio: c.dominio, contato_nome: c.contato_nome, contato_whatsapp: c.contato_whatsapp, contato_email: c.contato_email, observacoes: c.observacoes, gestor_ativo: c.gestor_ativo, limite_consultores: c.limite_consultores || 30 })
    setEditando(c)
    setTipoNovo('empresa')
    setAba('novo')
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#08090d', border: '1px solid #252836', borderRadius: 8, padding: '10px 12px', color: '#f0f1f5', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { display: 'block', color: '#8a8fa3', fontSize: 13, marginBottom: 6, fontWeight: 500 }
  const cardStyle: React.CSSProperties = { background: '#181b24', border: '1px solid #252836', borderRadius: 12, padding: '20px 24px' }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clientes', label: 'Clientes', icon: '🏢' },
    { id: 'novo', label: 'Novo Cliente', icon: '➕' },
    { id: 'testar', label: 'Testar', icon: '🧪' },
    { id: 'cobranca', label: 'Cobranças', icon: '💰' },
  ] as const

  const sidebarW = colapsada ? 56 : 220

  return (
    <div style={{ minHeight: '100vh', background: '#08090d', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', display: 'flex' }}>

      {/* Barra superior mobile */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 400, background: '#181b24', borderBottom: '1px solid #252836', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12 }}>
          <button onClick={() => setMenuAberto(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f0f1f5', display: 'flex', fontSize: 22, padding: 4 }}>
            {menuAberto ? '✕' : '☰'}
          </button>
          <img src="/oito7-logo.png" alt="Oito7" style={{ height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontSize: 12, color: '#8a8fa3', marginLeft: 4 }}>Painel Master</span>
        </div>
      )}

      {/* Overlay mobile */}
      {isMobile && menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 450 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        background: '#181b24', borderRight: '1px solid #252836', display: 'flex', flexDirection: 'column', padding: '20px 0 0', overflow: 'hidden',
        ...(isMobile ? {
          width: 240, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 500,
          transform: menuAberto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          boxShadow: menuAberto ? '6px 0 32px rgba(0,0,0,0.5)' : 'none',
        } : {
          width: sidebarW, position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
          transition: 'width 0.22s ease', overflowY: 'auto',
        }),
      }}>
        <div style={{ padding: colapsada ? '0 8px 16px' : '0 16px 16px', borderBottom: '1px solid #252836', display: 'flex', alignItems: 'center', justifyContent: colapsada ? 'center' : 'space-between', gap: 8, minHeight: 52 }}>
          {!colapsada && (
            <div style={{ flex: 1 }}>
              <img src="/oito7-logo.png" alt="Oito7 Digital" style={{ maxHeight: 36, maxWidth: 140, objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block' }} />
              <p style={{ fontSize: 10, color: '#8a8fa3', marginTop: 2, whiteSpace: 'nowrap' }}>Painel Master</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {!isMobile && (
              <button onClick={() => setColapsada(c => !c)} title={colapsada ? 'Expandir' : 'Recolher'}
                style={{ background: '#252836', border: 'none', cursor: 'pointer', color: '#8a8fa3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6 }}>
                {colapsada ? '›' : '‹'}
              </button>
            )}
            {isMobile && (
              <button onClick={() => setMenuAberto(false)} style={{ background: '#252836', border: 'none', cursor: 'pointer', color: '#f0f1f5', display: 'flex', padding: 6, borderRadius: 6, fontSize: 16 }}>✕</button>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: colapsada ? '12px 8px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setAba(item.id as any); if (item.id !== 'novo') { setEditando(null); setTipoNovo(''); setForm({ nome: '', dominio: '', contato_nome: '', contato_whatsapp: '', contato_email: '', observacoes: '', gestor_ativo: false, limite_consultores: 30 }) } if (isMobile) setMenuAberto(false) }}
              title={colapsada ? item.label : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: colapsada ? 0 : 10, justifyContent: colapsada ? 'center' : 'flex-start', padding: colapsada ? '10px 0' : '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: aba === item.id ? '#f0f1f5' : '#8a8fa3', background: aba === item.id ? '#252836' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!colapsada && <span>{item.label}</span>}
            </button>
          ))}
          {!colapsada && clientes.filter(c => c.ativo).length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #252836' }}>
              <p style={{ fontSize: 10, color: '#8a8fa3', fontWeight: 700, padding: '0 12px', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Painéis dos Clientes</p>
              {clientes.filter(c => c.ativo).map(c => (
                <a key={c.id} href={c.dominio ? `https://${c.dominio}/admin` : '/admin'} target="_blank"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#8a8fa3', textDecoration: 'none' }}>
                  🎓 {c.nome.split('—')[0].trim()}
                </a>
              ))}
            </div>
          )}
        </nav>
        <div style={{ padding: colapsada ? '12px 8px' : '12px 16px', borderTop: '1px solid #252836', display: 'flex', flexDirection: 'column', gap: 8, alignItems: colapsada ? 'center' : 'stretch' }}>
          {!colapsada && <p style={{ fontSize: 12, color: '#8a8fa3' }}>Logado como <strong style={{ color: '#f0f1f5' }}>{nome}</strong></p>}
          <button onClick={sair} title={colapsada ? 'Sair' : undefined} style={{ background: 'none', border: '1px solid #252836', color: '#8a8fa3', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: colapsada ? 16 : 13 }}>
            {colapsada ? '🚪' : 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: isMobile ? '68px 14px 40px' : 32, overflow: 'auto', minWidth: 0 }}>

        {aba === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
            <p style={{ color: '#8a8fa3', fontSize: 14, marginBottom: 28 }}>Visão geral da Oito7 Digital</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Consultores', valor: stats.totalAlunos, icon: '👥' },
                { label: 'Gestores', valor: stats.totalGestores, icon: '🧑‍💼' },
                { label: 'Admins', valor: stats.totalAdmins, icon: '🛡️' },
                { label: 'Módulos', valor: stats.totalModulos, icon: '📚' },
                { label: 'Aulas', valor: stats.totalAulas, icon: '🎬' },
              ].map(s => (
                <div key={s.label} style={cardStyle}>
                  <p style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>{s.valor}</p>
                  <p style={{ fontSize: 13, color: '#8a8fa3' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={cardStyle}>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏢 Clientes Ativos</p>
                {clientes.filter(c => c.ativo).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #252836' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</p>
                      {c.dominio && <p style={{ fontSize: 12, color: '#8a8fa3' }}>{c.dominio}</p>}
                    </div>
                    <span style={{ background: '#6366f125', color: '#6366f1', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      Completo
                    </span>
                  </div>
                ))}
                {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: '#8a8fa3', fontSize: 13 }}>Nenhum cliente ativo.</p>}
              </div>

              <div style={cardStyle}>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🆕 Últimos Consultores</p>
                {recentesAlunos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #252836' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{a.nome}</p>
                      <p style={{ fontSize: 12, color: '#8a8fa3' }}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span style={{ background: a.status === 'ativo' ? '#02A15320' : '#25283620', color: a.status === 'ativo' ? '#02A153' : '#8a8fa3', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'testar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🧪 Testar Plataforma</h1>
              <p style={{ color: '#8a8fa3', fontSize: 14 }}>Acesse cada painel para testar antes de liberar atualizações</p>
            </div>

            {/* Links rápidos — todos os painéis */}
            <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 12, padding: 24 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Links Rápidos — Domínio Principal</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { icon: '🛡️', label: 'Admin', link: `${BASE_URL}/admin`, cor: '#6366f1' },
                  { icon: '🧑‍💼', label: 'Gestor', link: `${BASE_URL}/gestor`, cor: '#f59e0b' },
                  { icon: '🌐', label: 'Captação', link: `${BASE_URL}/captacao`, cor: '#02A153' },
                  { icon: '🔑', label: 'Login', link: `${BASE_URL}/login`, cor: '#8a8fa3' },
                ].map(p => (
                  <a key={p.label} href={p.link} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: p.cor + '15', border: `1px solid ${p.cor}40`, borderRadius: 10, padding: '16px 12px', textDecoration: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: 28 }}>{p.icon}</span>
                    <span style={{ color: p.cor, fontWeight: 700, fontSize: 13 }}>{p.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Experiência do Consultor */}
            <div style={{ background: '#181b24', border: '1px solid #02A15340', borderRadius: 12, padding: 24 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>👤 Experiência do Consultor</p>
              <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 16 }}>Acesse o login de cada empresa e entre com uma conta de consultor para ver exatamente o que ele vê.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={`${BASE_URL}/login`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#08090d', borderRadius: 8, padding: '12px 16px', textDecoration: 'none' }}>
                  <span style={{ color: '#f0f1f5', fontWeight: 600, fontSize: 14 }}>Oito7 Digital (domínio principal)</span>
                  <span style={{ color: '#02A153', fontWeight: 700, fontSize: 12 }}>Entrar como Consultor ↗</span>
                </a>
                {clientes.filter(c => c.ativo && c.dominio).map(c => (
                  <a key={c.id} href={`https://${c.dominio}/login`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#08090d', borderRadius: 8, padding: '12px 16px', textDecoration: 'none' }}>
                    <span style={{ color: '#f0f1f5', fontWeight: 600, fontSize: 14 }}>{c.nome}</span>
                    <span style={{ color: '#02A153', fontWeight: 700, fontSize: 12 }}>Entrar como Consultor ↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Por cliente */}
            {clientes.filter(c => c.ativo).length > 0 && (
              <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 12, padding: 24 }}>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🏢 Testar por Empresa Cliente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {clientes.filter(c => c.ativo).map(c => {
                    const url = c.dominio ? `https://${c.dominio}` : BASE_URL
                    return (
                      <div key={c.id} style={{ background: '#08090d', borderRadius: 10, padding: '14px 16px' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{c.nome}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[
                            { label: '🛡️ Admin', link: `${url}/admin` },
                            { label: '🧑‍💼 Gestor', link: `${url}/gestor` },
                            { label: '🌐 Captação', link: `${url}/captacao` },
                            { label: '🔑 Login', link: `${url}/login` },
                          ].map(btn => (
                            <a key={btn.label} href={btn.link} target="_blank" rel="noreferrer"
                              style={{ background: '#252836', color: '#f0f1f5', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                              {btn.label} ↗
                            </a>
                          ))}
                        </div>
                        {c.dominio && <p style={{ fontSize: 11, color: '#8a8fa3', marginTop: 8 }}>🌐 {c.dominio}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {aba === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Clientes ({clientes.length})</h1>
                <p style={{ color: '#8a8fa3', fontSize: 14 }}>Empresas que utilizam a plataforma</p>
              </div>
              <button onClick={() => setAba('novo')} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
                + Novo Cliente
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientes.map(c => (
                <div key={c.id} style={{ ...cardStyle, opacity: c.ativo ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <p style={{ fontWeight: 700, fontSize: 16 }}>{c.nome}</p>
                        <span style={{ background: '#6366f125', color: '#6366f1', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          Completo
                        </span>
                        {c.gestor_ativo && <span style={{ background: '#f59e0b25', color: '#f59e0b', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>+ Painel Gestor</span>}
                        <span style={{ background: '#02A15325', color: '#02A153', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Admin ilimitado</span>
                      </div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#8a8fa3', flexWrap: 'wrap' }}>
                        {c.dominio && <span>🌐 {c.dominio}</span>}
                        {c.contato_nome && <span>👤 {c.contato_nome}</span>}
                        {c.contato_whatsapp && <span>📱 {c.contato_whatsapp}</span>}
                        {c.contato_email && <span>✉️ {c.contato_email}</span>}
                      </div>
                      {c.observacoes && <p style={{ fontSize: 12, color: '#8a8fa3', marginTop: 6 }}>{c.observacoes}</p>}
                      <p style={{ fontSize: 11, color: '#8a8fa3', marginTop: 6 }}>Cliente desde {new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => iniciarEdicao(c)} style={{ background: '#252836', border: 'none', color: '#f0f1f5', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Editar</button>
                      <button onClick={() => toggleAtivo(c)} style={{ background: c.ativo ? '#f59e0b20' : '#02A15320', border: 'none', color: c.ativo ? '#f59e0b' : '#02A153', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        {c.ativo ? 'Suspender' : 'Reativar'}
                      </button>
                      <button onClick={() => excluirCliente(c)} style={{ background: '#e6394620', border: 'none', color: '#e63946', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'novo' && (
          <div style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{editando ? 'Editar Cliente' : 'Cadastrar'}</h1>
            <p style={{ color: '#8a8fa3', fontSize: 14, marginBottom: 28 }}>O que deseja cadastrar na plataforma?</p>

            {/* Seleção de tipo — só aparece quando não está editando */}
            {!editando && !tipoNovo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                  { tipo: 'empresa' as const, icon: '🏢', label: 'Empresa', desc: 'Nova empresa cliente da plataforma' },
                  { tipo: 'gestor' as const, icon: '🧑‍💼', label: 'Gestor', desc: 'Gestor vinculado a uma empresa' },
                  { tipo: 'consultor' as const, icon: '👤', label: 'Consultor', desc: 'Consultor de uma empresa cliente' },
                ].map(({ tipo, icon, label, desc }) => (
                  <button key={tipo} onClick={() => setTipoNovo(tipo)}
                    style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '28px 16px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = '#252836')}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
                    <p style={{ fontWeight: 800, fontSize: 16, color: '#f0f1f5', marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#8a8fa3', lineHeight: 1.4 }}>{desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Formulário Empresa */}
            {(tipoNovo === 'empresa' || editando) && (
              <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!editando && (
                  <button onClick={() => setTipoNovo('')} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#8a8fa3', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 4 }}>
                    ← Voltar
                  </button>
                )}
                <div><label style={labelStyle}>Nome da empresa *</label><input style={inputStyle} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Auto Vale Prevenções — Uni AVP" /></div>
                <div><label style={labelStyle}>Domínio personalizado</label><input style={inputStyle} value={form.dominio} onChange={e => setForm(p => ({ ...p, dominio: e.target.value }))} placeholder="Ex: uni.empresa.com.br" /></div>
                <div style={{ background: '#08090d', borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 11, color: '#8a8fa3', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Recursos contratados</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: '#181b24', borderRadius: 8 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div>
                      <p style={{ color: '#f0f1f5', fontSize: 13, fontWeight: 700 }}>Plano Completo</p>
                      <p style={{ fontSize: 11, color: '#8a8fa3', marginTop: 1 }}>Admin ilimitado · Módulos · Aulas · Quiz · Ranking · Artes</p>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 12px', background: '#181b24', borderRadius: 8 }}>
                    <input type="checkbox" checked={form.gestor_ativo} onChange={e => setForm(p => ({ ...p, gestor_ativo: e.target.checked }))} style={{ width: 18, height: 18, accentColor: '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <p style={{ color: '#f0f1f5', fontSize: 13, fontWeight: 700 }}>Painel do Gestor <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>(add-on — cobrado à parte)</span></p>
                      <p style={{ fontSize: 11, color: '#8a8fa3', marginTop: 1 }}>A empresa cadastra seus próprios gestores · cada gestor gerencia até 30 consultores</p>
                    </div>
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={labelStyle}>Nome do contato</label><input style={inputStyle} value={form.contato_nome} onChange={e => setForm(p => ({ ...p, contato_nome: e.target.value }))} /></div>
                  <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} value={form.contato_whatsapp} onChange={e => setForm(p => ({ ...p, contato_whatsapp: e.target.value }))} /></div>
                </div>
                <div><label style={labelStyle}>E-mail</label><input style={inputStyle} value={form.contato_email} onChange={e => setForm(p => ({ ...p, contato_email: e.target.value }))} /></div>
                <div><label style={labelStyle}>Observações</label><textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' } as React.CSSProperties} value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                {msg && <p style={{ fontSize: 13, color: msg.includes('Erro') ? '#e63946' : '#02A153' }}>{msg}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={salvarCliente} disabled={salvando}
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                    {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar Empresa'}
                  </button>
                  <button onClick={() => { setAba('clientes'); setEditando(null); setTipoNovo('') }}
                    style={{ background: 'none', border: '1px solid #252836', color: '#8a8fa3', borderRadius: 8, padding: '12px 20px', cursor: 'pointer', fontSize: 14 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Gestor — redireciona para o admin do cliente */}
            {tipoNovo === 'gestor' && (
              <div style={cardStyle}>
                <button onClick={() => setTipoNovo('')} style={{ background: 'none', border: 'none', color: '#8a8fa3', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16 }}>
                  ← Voltar
                </button>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧑‍💼</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Cadastrar Gestor</h2>
                <p style={{ color: '#8a8fa3', fontSize: 14, marginBottom: 20 }}>Gestores são cadastrados pelo painel Admin de cada empresa cliente.</p>
                <p style={{ fontSize: 13, color: '#8a8fa3', marginBottom: 16 }}>Acesse o painel Admin da empresa desejada:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientes.filter(c => c.ativo).map(c => (
                    <a key={c.id} href={`${c.dominio ? `https://${c.dominio}` : BASE_URL}/admin/gestores`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#08090d', borderRadius: 8, padding: '12px 16px', textDecoration: 'none', color: '#f0f1f5' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</span>
                      <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>Abrir Admin ↗</span>
                    </a>
                  ))}
                  {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: '#8a8fa3', fontSize: 13 }}>Nenhuma empresa ativa cadastrada.</p>}
                </div>
              </div>
            )}

            {/* Consultor — redireciona para o admin do cliente */}
            {tipoNovo === 'consultor' && (
              <div style={cardStyle}>
                <button onClick={() => setTipoNovo('')} style={{ background: 'none', border: 'none', color: '#8a8fa3', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16 }}>
                  ← Voltar
                </button>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Cadastrar Consultor</h2>
                <p style={{ color: '#8a8fa3', fontSize: 14, marginBottom: 20 }}>Consultores são cadastrados pelo painel Admin de cada empresa cliente.</p>
                <p style={{ fontSize: 13, color: '#8a8fa3', marginBottom: 16 }}>Acesse o painel Admin da empresa desejada:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientes.filter(c => c.ativo).map(c => (
                    <a key={c.id} href={`${c.dominio ? `https://${c.dominio}` : BASE_URL}/admin/consultores`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#08090d', borderRadius: 8, padding: '12px 16px', textDecoration: 'none', color: '#f0f1f5' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.nome}</span>
                      <span style={{ fontSize: 12, color: '#02A153', fontWeight: 700 }}>Abrir Admin ↗</span>
                    </a>
                  ))}
                  {clientes.filter(c => c.ativo).length === 0 && <p style={{ color: '#8a8fa3', fontSize: 13 }}>Nenhuma empresa ativa cadastrada.</p>}
                </div>
              </div>
            )}
          </div>
        )}
        {aba === 'cobranca' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>💰 Cobranças</h1>
                <p style={{ color: '#8a8fa3', fontSize: 14 }}>Gerencie mensalidades e acesso dos clientes</p>
              </div>
              <button
                disabled={registrandoWebhook}
                onClick={async () => {
                  setRegistrandoWebhook(true); setCobrancaMsg('')
                  const res = await fetch('/api/super/webhook-efi', { method: 'POST' })
                  const data = await res.json()
                  setRegistrandoWebhook(false)
                  setCobrancaMsg(res.ok ? `✅ Webhook Efí registrado: ${data.webhookUrl}` : `Erro webhook: ${data.error}`)
                }}
                style={{ background: '#252836', border: '1px solid #374151', color: '#8a8fa3', borderRadius: 8, padding: '9px 16px', cursor: registrandoWebhook ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: registrandoWebhook ? 0.6 : 1 }}>
                {registrandoWebhook ? '⏳ Registrando...' : '⚙️ Registrar Webhook Efí'}
              </button>
            </div>
            {cobrancaMsg && (
              <div style={{ background: cobrancaMsg.includes('Erro') ? '#e6394620' : '#02A15320', border: `1px solid ${cobrancaMsg.includes('Erro') ? '#e63946' : '#02A153'}`, borderRadius: 8, padding: '12px 16px', color: cobrancaMsg.includes('Erro') ? '#e63946' : '#02A153', fontSize: 14, marginBottom: 20 }}>
                {cobrancaMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientes.map(c => {
                const statusColor: Record<string, string> = { em_dia: '#02A153', pendente: '#f59e0b', suspenso: '#e63946', atrasado: '#e63946' }
                const statusLabel: Record<string, string> = { em_dia: '✅ Em dia', pendente: '⏳ Pendente', suspenso: '🔴 Suspenso', atrasado: '⚠️ Atrasado' }
                const st = (c as any).status_pagamento || 'em_dia'
                return (
                  <div key={c.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <p style={{ fontWeight: 700, fontSize: 15 }}>{c.nome}</p>
                        <span style={{ background: (statusColor[st] || '#8a8fa3') + '20', color: statusColor[st] || '#8a8fa3', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                          {statusLabel[st] || st}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#8a8fa3', flexWrap: 'wrap' }}>
                        <span>💵 R$ {Number((c as any).mensalidade || 0).toFixed(2).replace('.', ',')}/mês</span>
                        <span>📅 Vence dia {(c as any).vencimento_dia || 10}</span>
                        {(c as any).ultimo_pagamento && <span>✅ Último: {new Date((c as any).ultimo_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Campo mensalidade inline */}
                      <input
                        type="number" placeholder="R$ mensalidade" min={0} step={0.01}
                        defaultValue={(c as any).mensalidade || ''}
                        onBlur={async e => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) {
                            await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, mensalidade: val }) })
                            setClientes(prev => prev.map(x => x.id === c.id ? { ...x, ...{ mensalidade: val } as any } : x))
                          }
                        }}
                        style={{ width: 120, background: '#08090d', border: '1px solid #252836', borderRadius: 6, padding: '7px 10px', color: '#f0f1f5', fontSize: 13, outline: 'none' }}
                      />
                      <button
                        disabled={gerandoPix === c.id}
                        onClick={async () => {
                          setGerandoPix(c.id); setCobrancaMsg('')
                          const res = await fetch('/api/super/cobranca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: c.id }) })
                          const data = await res.json()
                          setGerandoPix(null)
                          setCobrancaMsg(res.ok ? `PIX gerado e enviado para ${c.nome}!` : `Erro: ${data.error}`)
                        }}
                        style={{ background: '#6366f120', border: '1px solid #6366f140', color: '#6366f1', borderRadius: 8, padding: '8px 14px', cursor: gerandoPix === c.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', opacity: gerandoPix === c.id ? 0.6 : 1 }}>
                        {gerandoPix === c.id ? '⏳ Gerando...' : '📲 Gerar PIX'}
                      </button>
                      {st === 'suspenso' && (
                        <button
                          onClick={async () => {
                            await fetch('/api/super/clientes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ativo: true, status_pagamento: 'em_dia' }) })
                            setClientes(prev => prev.map(x => x.id === c.id ? { ...x, ativo: true, ...{ status_pagamento: 'em_dia' } as any } : x))
                            setCobrancaMsg(`${c.nome} reativado manualmente.`)
                          }}
                          style={{ background: '#02A15320', border: 'none', color: '#02A153', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                          Reativar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              {clientes.length === 0 && <p style={{ color: '#8a8fa3', fontSize: 13 }}>Nenhum cliente cadastrado.</p>}
            </div>
            <div style={{ marginTop: 24, padding: 16, background: '#181b24', borderRadius: 10, fontSize: 13, color: '#8a8fa3' }}>
              <p style={{ fontWeight: 700, color: '#f0f1f5', marginBottom: 6 }}>Como funciona:</p>
              <p>• Defina a mensalidade de cada cliente no campo ao lado e clique fora para salvar</p>
              <p>• Clique em <strong style={{ color: '#f0f1f5' }}>Gerar PIX</strong> para criar a cobrança e enviar por WhatsApp automaticamente</p>
              <p>• O sistema gera e envia cobranças automaticamente <strong style={{ color: '#f0f1f5' }}>5 dias antes do vencimento</strong></p>
              <p>• Após <strong style={{ color: '#f0f1f5' }}>3 dias de atraso</strong> o acesso é suspenso automaticamente</p>
              <p>• Quando o pagamento é confirmado, o acesso é reativado instantaneamente</p>
              <p style={{ marginTop: 8, color: '#6366f1', fontWeight: 600 }}>⚙️ Registre o webhook da Efí em: <span style={{ fontFamily: 'monospace' }}>{process.env.NEXT_PUBLIC_APP_URL || 'https://universidade.oito7digital.com.br'}/api/webhooks/pix</span></p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
