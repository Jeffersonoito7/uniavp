'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import GestorLayout from './GestorLayout'
import LiberacoesPendentes from './LiberacoesPendentes'
import WhatsAppConectar from '@/app/components/WhatsAppConectar'
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
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosCarregados, setEventosCarregados] = useState(false)
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
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  return (
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
              <button onClick={copiarLink}
                style={{ background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {linkCopiado ? '✓ Copiado!' : '+ Novo consultor'}
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
            <div style={{ overflowX: 'auto' }}>
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
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--avp-text-dim)' }}>
                        Nenhum consultor vinculado. Clique em "+ Novo consultor" para copiar seu link de cadastro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
  )
}
