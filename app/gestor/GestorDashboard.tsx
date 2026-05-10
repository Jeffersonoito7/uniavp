'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import GestorLayout from './GestorLayout'
import LiberacoesPendentes from './LiberacoesPendentes'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'
import PhoneInput from '@/app/components/PhoneInput'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'

type Consultor = {
  id: string; nome: string; whatsapp: string; email: string; status: string; created_at: string
}
type Modulo = {
  titulo: string; ordem: number; aulas_total: number; aulas_concluidas: number; percentual: number
}
type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }
type Gestor = { id: string; nome: string; email: string; whatsapp: string }

const badgeStatus: Record<string, { label: string; color: string; bg: string }> = {
  ativo: { label: 'Ativo', color: 'var(--avp-green)', bg: '#02A15320' },
  concluido: { label: 'Concluído', color: '#333687', bg: '#33368720' },
  pausado: { label: 'Pausado', color: '#f59e0b', bg: '#f59e0b20' },
  desligado: { label: 'Desligado', color: 'var(--avp-danger)', bg: '#e6394620' },
}

function BarraProgresso({ pct }: { pct: number }) {
  const cor = pct === 100 ? 'var(--avp-green)' : pct > 0 ? 'var(--avp-blue)' : 'var(--avp-border)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'var(--avp-border)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: cor, height: '100%', borderRadius: 100, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', minWidth: 32 }}>{pct}%</span>
    </div>
  )
}

export default function GestorDashboard({
  gestor, consultores, progressoMap,
}: {
  gestor: Gestor; consultores: Consultor[]; progressoMap: Record<string, number>
}) {
  const [aba, setAba] = useState('dashboard')
  const [listaConsultores, setListaConsultores] = useState(consultores)
  const [consultorSelecionado, setConsultorSelecionado] = useState<Consultor | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [carregandoModulos, setCarregandoModulos] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [showNovoConsultor, setShowNovoConsultor] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', whatsapp: '', email: '', senha: '' })
  const [salvandoConsultor, setSalvandoConsultor] = useState(false)
  const [msgConsultor, setMsgConsultor] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [verSenhaNovo, setVerSenhaNovo] = useState(false)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosCarregados, setEventosCarregados] = useState(false)
  const [modulosAulas, setModulosAulas] = useState<{ id: string; titulo: string; ordem: number; aulas: { id: string; titulo: string; descricao: string | null; youtube_video_id: string; duracao_minutos: number | null; ordem: number }[] }[]>([])
  const [aulasCarregadas, setAulasCarregadas] = useState(false)
  const [aulaAberta, setAulaAberta] = useState<{ id: string; titulo: string; youtube_video_id: string; descricao: string | null } | null>(null)
  const [eventoForm, setEventoForm] = useState({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
  const [salvandoEvento, setSalvandoEvento] = useState(false)
  const [showEvento, setShowEvento] = useState(false)
  const [msgEvento, setMsgEvento] = useState('')

  const ativos = listaConsultores.filter(c => c.status !== 'concluido')
  const emAndamento = listaConsultores.filter(c => c.status === 'ativo' && progressoMap[c.id] > 0).length
  const concluidos = listaConsultores.filter(c => c.status === 'concluido').length
  const vagasUsadas = ativos.length
  const vagasLivres = 50 - vagasUsadas

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/g/${gestor.whatsapp}`)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function cadastrarConsultor(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoConsultor(true)
    setMsgConsultor(null)
    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novoForm.nome,
        whatsapp: novoForm.whatsapp.replace(/\D/g, ''),
        email: novoForm.email,
        senha: novoForm.senha,
        gestor_nome: gestor.nome,
        gestor_whatsapp: gestor.whatsapp,
      }),
    })
    const data = await res.json()
    if (data.ok || data.aluno) {
      setMsgConsultor({ tipo: 'ok', texto: `Consultor "${novoForm.nome}" cadastrado com sucesso!` })
      if (data.aluno) {
        setListaConsultores(prev => [data.aluno, ...prev])
      }
      setNovoForm({ nome: '', whatsapp: '', email: '', senha: '' })
      setTimeout(() => { setShowNovoConsultor(false); setMsgConsultor(null) }, 2500)
    } else {
      setMsgConsultor({ tipo: 'err', texto: data.erro ?? data.error ?? 'Erro ao cadastrar.' })
    }
    setSalvandoConsultor(false)
  }

  async function removerConsultor(c: Consultor) {
    if (!confirm(`Remover ${c.nome} da sua equipe?`)) return
    const res = await fetch('/api/gestor/consultor', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunoId: c.id }),
    })
    if (res.ok) setListaConsultores(prev => prev.filter(x => x.id !== c.id))
  }

  async function abrirConsultor(c: Consultor) {
    setConsultorSelecionado(c)
    setCarregandoModulos(true)
    setModulos([])
    try {
      const res = await fetch(`/api/gestor/consultor-progresso?alunoId=${c.id}`)
      const data = await res.json()
      setModulos(data.modulos ?? [])
    } catch { setModulos([]) }
    setCarregandoModulos(false)
  }

  async function carregarEventos() {
    if (eventosCarregados) return
    const res = await fetch('/api/gestor/eventos')
    setEventos(await res.json())
    setEventosCarregados(true)
  }

  async function carregarAulas() {
    if (aulasCarregadas) return
    const res = await fetch('/api/gestor/aulas')
    const data = await res.json()
    const mods = (data.modulos ?? []) as { id: string; titulo: string; ordem: number }[]
    const auls = (data.aulas ?? []) as { id: string; titulo: string; descricao: string | null; youtube_video_id: string; duracao_minutos: number | null; ordem: number; modulo_id: string }[]
    const agrupado = mods.map(m => ({
      ...m,
      aulas: auls.filter(a => a.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem),
    }))
    setModulosAulas(agrupado)
    setAulasCarregadas(true)
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoEvento(true)
    const res = await fetch('/api/gestor/eventos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventoForm),
    })
    const data = await res.json()
    if (data.id) {
      setEventos(prev => [...prev, data])
      setEventoForm({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
      setShowEvento(false)
      setMsgEvento('Evento criado!')
    } else {
      setMsgEvento('Erro ao criar evento.')
    }
    setSalvandoEvento(false)
    setTimeout(() => setMsgEvento(''), 3000)
  }

  async function removerEvento(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch('/api/gestor/eventos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEventos(prev => prev.filter(ev => ev.id !== id))
  }

  function handleSetAba(id: string) {
    setAba(id)
    if (id === 'eventos') carregarEventos()
    if (id === 'aulas') carregarAulas()
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 1 }

  return (
    <>
    {/* Modal Novo Consultor */}
    {showNovoConsultor && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
        onClick={e => e.target === e.currentTarget && setShowNovoConsultor(false)}>
        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Novo Consultor</h2>
            <button onClick={() => setShowNovoConsultor(false)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
          </div>
          <div style={{ padding: 28 }}>
            {/* Aba link ou cadastro manual */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>🔗 Link de cadastro</p>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginBottom: 10, lineHeight: 1.5 }}>Envie este link para o consultor se cadastrar sozinho</p>
                <button onClick={() => { copiarLink(); }}
                  style={{ width: '100%', background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-border)', color: linkCopiado ? '#fff' : 'var(--avp-text)', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {linkCopiado ? '✓ Link copiado!' : '📋 Copiar link'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--avp-border)', paddingTop: 20, marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>✍️ Cadastrar manualmente</p>
            </div>

            {msgConsultor && (
              <div style={{ padding: '10px 14px', background: msgConsultor.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msgConsultor.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msgConsultor.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 13, marginBottom: 16 }}>
                {msgConsultor.texto}
              </div>
            )}

            <form onSubmit={cadastrarConsultor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Nome completo *</label>
                <input type="text" placeholder="Nome do consultor" value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={lbl}>WhatsApp *</label>
                <PhoneInput value={novoForm.whatsapp} onChange={v => setNovoForm(p => ({ ...p, whatsapp: v }))} required />
              </div>
              <div>
                <label style={lbl}>E-mail *</label>
                <input type="email" placeholder="email@consultor.com" value={novoForm.email} onChange={e => setNovoForm(p => ({ ...p, email: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={lbl}>Senha inicial *</label>
                <div style={{ position: 'relative' }}>
                  <input type={verSenhaNovo ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={novoForm.senha} onChange={e => setNovoForm(p => ({ ...p, senha: e.target.value }))} required minLength={6} style={{ ...inp, paddingRight: 44 }} />
                  <button type="button" onClick={() => setVerSenhaNovo(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--avp-text-dim)', display: 'flex' }}>
                    {verSenhaNovo
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowNovoConsultor(false)}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoConsultor}
                  style={{ flex: 2, background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: salvandoConsultor ? 0.7 : 1 }}>
                  {salvandoConsultor ? 'Cadastrando...' : '+ Cadastrar consultor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    <GestorLayout aba={aba} setAba={handleSetAba} nomeGestor={gestor.nome}>

      {/* ── DASHBOARD ── */}
      {(aba === 'dashboard' || aba === 'consultores') && (
        <>
          <LiberacoesPendentes />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>
                {aba === 'dashboard' ? 'Dashboard' : 'Consultores'}
              </h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>
                Acompanhe o progresso da sua equipe
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <MuralNoticias />
              <EventosWidget />
              <button onClick={() => setShowNovoConsultor(true)}
                style={{ background: 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                + Novo consultor
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div style={{ background: 'var(--avp-card)', border: `1px solid ${vagasUsadas >= 50 ? 'var(--avp-danger)' : 'var(--avp-border)'}`, borderRadius: 12, padding: 20 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 6 }}>Vagas usadas</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: vagasUsadas >= 50 ? 'var(--avp-danger)' : 'var(--avp-text)' }}>{vagasUsadas}<span style={{ fontSize: 14, color: 'var(--avp-text-dim)', fontWeight: 400 }}>/50</span></p>
            </div>
            {[
              { label: 'Em andamento', value: emAndamento },
              { label: 'Concluídos', value: concluidos },
              { label: 'Vagas livres', value: vagasLivres },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 800 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Desktop: tabela | Mobile: cards */}
            <div className="table-scroll hide-mobile" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                    {['Nome', 'WhatsApp', 'Progresso', 'Status', 'Cadastro', ''].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listaConsultores.map(c => {
                    const pct = progressoMap[c.id] ?? 0
                    const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                        <td onClick={() => abrirConsultor(c)} style={{ padding: '13px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>{c.nome}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.whatsapp}</td>
                        <td style={{ padding: '13px 16px', minWidth: 150 }}><BarraProgresso pct={pct} /></td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{badge.label}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '13px 16px' }}>
                          {c.status !== 'concluido' && (
                            <button onClick={() => removerConsultor(c)}
                              style={{ background: '#e6394615', border: '1px solid #e6394630', color: 'var(--avp-danger)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Remover
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {listaConsultores.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor vinculado. Clique em "+ Novo consultor".</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="show-mobile" style={{ flexDirection: 'column', gap: 10, padding: 12 }}>
              {listaConsultores.length === 0 && (
                <p style={{ textAlign: 'center', padding: 32, color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum consultor vinculado ainda.</p>
              )}
              {listaConsultores.map(c => {
                const pct = progressoMap[c.id] ?? 0
                const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                return (
                  <div key={c.id} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <p onClick={() => abrirConsultor(c)} style={{ fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 2 }}>{c.nome}</p>
                        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{c.whatsapp}</p>
                      </div>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{badge.label}</span>
                    </div>
                    <BarraProgresso pct={pct} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => abrirConsultor(c)} style={{ background: 'var(--avp-border)', color: 'var(--avp-text)', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Ver progresso</button>
                        {c.status !== 'concluido' && (
                          <button onClick={() => removerConsultor(c)} style={{ background: '#e6394615', border: '1px solid #e6394630', color: 'var(--avp-danger)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remover</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── AULAS ── */}
      {aba === 'aulas' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Aulas</h1>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Assista a todos os módulos e aulas da plataforma</p>
          </div>

          {!aulasCarregadas && (
            <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 48 }}>Carregando aulas...</p>
          )}

          {modulosAulas.map(mod => (
            <div key={mod.id} style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--avp-border)' }}>
                {mod.titulo}
              </h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {mod.aulas.map(aula => (
                  <div key={aula.id}
                    onClick={() => setAulaAberta(aula)}
                    style={{ width: 200, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--avp-green)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--avp-border)' }}
                  >
                    <div style={{ height: 100, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, position: 'relative' }}>
                      {aula.youtube_video_id
                        ? <img src={`https://img.youtube.com/vi/${aula.youtube_video_id}/mqdefault.jpg`} alt={aula.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                        : '▶️'}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{aula.titulo}</p>
                      {aula.duracao_minutos && (
                        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>⏱ {aula.duracao_minutos} min</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {aulasCarregadas && modulosAulas.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
              <p>Nenhuma aula publicada ainda.</p>
            </div>
          )}

          {/* Modal player aula */}
          {aulaAberta && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}
              onClick={e => e.target === e.currentTarget && setAulaAberta(null)}>
              <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--avp-border)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{aulaAberta.titulo}</h3>
                  <button onClick={() => setAulaAberta(null)} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
                </div>
                <div style={{ padding: '0' }}>
                  {aulaAberta.youtube_video_id ? (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${aulaAberta.youtube_video_id}?autoplay=1&rel=0`}
                        title={aulaAberta.titulo}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '0 0 0 0' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Vídeo não disponível</div>
                  )}
                  {aulaAberta.descricao && (
                    <div style={{ padding: '16px 20px' }}>
                      <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 1.6 }}>{aulaAberta.descricao}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── EVENTOS ── */}
      {aba === 'eventos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Eventos</h1>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Crie eventos e notifique sua equipe</p>
            </div>
            <button onClick={() => setShowEvento(s => !s)}
              style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {showEvento ? 'Cancelar' : '+ Novo Evento'}
            </button>
          </div>

          {msgEvento && (
            <div style={{ padding: '10px 16px', background: msgEvento.includes('Erro') ? '#e6394620' : '#02A15320', border: `1px solid ${msgEvento.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)'}`, borderRadius: 8, color: msgEvento.includes('Erro') ? 'var(--avp-danger)' : 'var(--avp-green)', fontSize: 14, marginBottom: 16 }}>{msgEvento}</div>
          )}

          {showEvento && (
            <form onSubmit={salvarEvento} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Novo Evento</h3>
              <div className="evento-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Título *</label><input required value={eventoForm.titulo} onChange={e => setEventoForm(p => ({ ...p, titulo: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Cidade</label><input value={eventoForm.cidade} onChange={e => setEventoForm(p => ({ ...p, cidade: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Data e Hora *</label><input required type="datetime-local" value={eventoForm.data_hora} onChange={e => setEventoForm(p => ({ ...p, data_hora: e.target.value }))} style={inp} /></div>
                <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Descrição</label><input value={eventoForm.descricao} onChange={e => setEventoForm(p => ({ ...p, descricao: e.target.value }))} style={inp} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={eventoForm.notificar} onChange={e => setEventoForm(p => ({ ...p, notificar: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)' }} />
                <span style={{ fontSize: 14 }}>Notificar meus consultores via WhatsApp</span>
              </label>
              <button type="submit" disabled={salvandoEvento} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: salvandoEvento ? 0.7 : 1 }}>
                {salvandoEvento ? 'Salvando...' : 'Criar Evento'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eventos.length === 0 && !showEvento && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>
                Nenhum evento criado ainda. Clique em "+ Novo Evento" para criar.
              </div>
            )}
            {eventos.map(ev => (
              <div key={ev.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{ev.titulo}</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 4 }}>
                    📅 {new Date(ev.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {ev.cidade && ` · 📍 ${ev.cidade}`}
                  </p>
                </div>
                <button onClick={() => removerEvento(ev.id)} style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Remover</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── WHATSAPP ── */}
      {aba === 'whatsapp' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>WhatsApp</h1>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Conecte seu WhatsApp para receber notificações dos consultores</p>
          </div>
          <div style={{ maxWidth: 500 }}>
            <WhatsAppConectar />
          </div>
          <div style={{ marginTop: 20, background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20, maxWidth: 500 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📲 Como funciona</p>
            <ul style={{ color: 'var(--avp-text-dim)', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
              <li>Conecte seu WhatsApp pessoal ou de negócios</li>
              <li>Você receberá alertas quando um consultor concluir uma aula</li>
              <li>Seus consultores recebem notificações de novos eventos</li>
              <li>Fique por dentro do progresso da sua equipe em tempo real</li>
            </ul>
          </div>
        </>
      )}

      {/* Modal progresso consultor */}
      {consultorSelecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && (setConsultorSelecionado(null), setModulos([]))}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{consultorSelecionado.nome}</h2>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>{consultorSelecionado.whatsapp} · {consultorSelecionado.email}</p>
              </div>
              <button onClick={() => { setConsultorSelecionado(null); setModulos([]) }} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progresso por módulo</p>
            {carregandoModulos ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Carregando...</p>
            ) : modulos.length === 0 ? (
              <p style={{ color: 'var(--avp-text-dim)', textAlign: 'center', padding: 24 }}>Nenhum módulo encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {modulos.map((m, i) => {
                  const cor = m.percentual === 100 ? 'var(--avp-green)' : m.percentual > 0 ? 'var(--avp-blue)' : 'var(--avp-border)'
                  return (
                    <div key={i} style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.titulo}</span>
                        <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{m.aulas_concluidas}/{m.aulas_total} aulas</span>
                      </div>
                      <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${m.percentual}%`, background: cor, height: '100%', borderRadius: 100 }} />
                      </div>
                      <div style={{ textAlign: 'right', marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: m.percentual === 100 ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                          {m.percentual === 100 ? '✓ Concluído' : `${m.percentual}%`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </GestorLayout>
    </>
  )
}
