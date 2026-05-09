'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'

type Evento = { id: string; titulo: string; descricao: string; cidade: string; data_hora: string }

type Consultor = {
  id: string
  nome: string
  whatsapp: string
  email: string
  status: string
  created_at: string
}

type Modulo = {
  titulo: string
  ordem: number
  aulas_total: number
  aulas_concluidas: number
  percentual: number
}

type Gestor = {
  id: string
  nome: string
  email: string
  whatsapp: string
}

export default function GestorDashboard({
  gestor,
  consultores,
  progressoMap,
  whatsappWidget,
}: {
  gestor: Gestor
  consultores: Consultor[]
  progressoMap: Record<string, number>
  whatsappWidget?: React.ReactNode
}) {
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [consultorSelecionado, setConsultorSelecionado] = useState<Consultor | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [carregandoModulos, setCarregandoModulos] = useState(false)
  const [showEvento, setShowEvento] = useState(false)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoForm, setEventoForm] = useState({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
  const [salvandoEvento, setSalvandoEvento] = useState(false)
  const [msgEvento, setMsgEvento] = useState('')
  const [abaGestor, setAbaGestor] = useState<'consultores' | 'eventos' | 'config'>('consultores')

  const [listaConsultores, setListaConsultores] = useState(consultores)
  const ativos = listaConsultores.filter(c => c.status !== 'concluido')
  const totalConsultores = listaConsultores.length
  const emAndamento = listaConsultores.filter(c => c.status === 'ativo' && progressoMap[c.id] > 0).length
  const concluidos = listaConsultores.filter(c => c.status === 'concluido').length
  const vagasUsadas = ativos.length
  const vagasLivres = 50 - vagasUsadas

  async function sair() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function copiarLink() {
    const url = `${window.location.origin}/g/${gestor.whatsapp}`
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function removerConsultor(c: Consultor) {
    if (!confirm(`Remover ${c.nome} da sua equipe? O consultor perde a associação com você e libera uma vaga.`)) return
    const res = await fetch('/api/gestor/consultor', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
    } catch {
      setModulos([])
    }
    setCarregandoModulos(false)
  }

  function fecharModal() {
    setConsultorSelecionado(null)
    setModulos([])
  }

  async function carregarEventos() {
    const res = await fetch('/api/gestor/eventos')
    const data = await res.json()
    setEventos(data)
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoEvento(true)
    setMsgEvento('')
    const res = await fetch('/api/gestor/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventoForm),
    })
    const data = await res.json()
    if (data.id) {
      setEventos(prev => [...prev, data])
      setEventoForm({ titulo: '', descricao: '', cidade: '', data_hora: '', notificar: true })
      setShowEvento(false)
      setMsgEvento('Evento criado com sucesso!')
    } else {
      setMsgEvento('Erro ao criar evento.')
    }
    setSalvandoEvento(false)
    setTimeout(() => setMsgEvento(''), 3000)
  }

  async function removerEvento(id: string) {
    await fetch('/api/gestor/eventos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setEventos(prev => prev.filter(ev => ev.id !== id))
  }

  const badgeStatus: Record<string, { label: string; color: string; bg: string }> = {
    ativo: { label: 'Ativo', color: 'var(--avp-green)', bg: '#02A15320' },
    concluido: { label: 'Concluído', color: '#333687', bg: '#33368720' },
    pausado: { label: 'Pausado', color: '#f59e0b', bg: '#f59e0b20' },
    desligado: { label: 'Desligado', color: 'var(--avp-danger)', bg: '#e6394620' },
  }

  function barraProgresso(pct: number) {
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ background: 'var(--avp-card)', borderBottom: '1px solid var(--avp-border)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo AVP" style={{ height: 36, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <span style={{ fontWeight: 800, fontSize: 16, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            UNIVERSIDADE AVP
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Olá, <strong style={{ color: 'var(--avp-text)' }}>{gestor.nome}</strong></span>
          <MuralNoticias />
          <EventosWidget />
          <ThemeToggle />
          <button onClick={sair} style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
            Sair
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--avp-text)' }}>Painel do Gestor</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 14, marginTop: 4 }}>Acompanhe o progresso dos seus consultores</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          <div style={{ background: 'var(--avp-card)', border: `1px solid ${vagasUsadas >= 50 ? 'var(--avp-danger)' : 'var(--avp-border)'}`, borderRadius: 12, padding: 24 }}>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>Vagas usadas</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: vagasUsadas >= 50 ? 'var(--avp-danger)' : 'var(--avp-text)' }}>{vagasUsadas}<span style={{ fontSize: 16, color: 'var(--avp-text-dim)', fontWeight: 400 }}>/50</span></p>
            {vagasUsadas >= 50 && <p style={{ fontSize: 11, color: 'var(--avp-danger)', marginTop: 4, fontWeight: 600 }}>Limite atingido</p>}
            <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>Concluídos não ocupam vaga</p>
          </div>
          {[
            { label: 'Em andamento', value: emAndamento },
            { label: 'Concluídos', value: concluidos },
            { label: 'Vagas livres', value: vagasLivres },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--avp-text)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'consultores', label: '👥 Consultores' }, { id: 'eventos', label: '🗓️ Eventos' }, { id: 'config', label: '⚙️ Configurações' }].map(aba => (
            <button key={aba.id} onClick={() => { setAbaGestor(aba.id as any); if (aba.id === 'eventos' && eventos.length === 0) carregarEventos() }}
              style={{ background: abaGestor === aba.id ? 'var(--avp-blue)' : 'var(--avp-card)', color: abaGestor === aba.id ? '#fff' : 'var(--avp-text-dim)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {aba.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {abaGestor === 'consultores' && (
            <button onClick={copiarLink} style={{ background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {linkCopiado ? 'Link copiado!' : 'Cadastrar novo consultor'}
            </button>
          )}
          {abaGestor === 'eventos' && (
            <button onClick={() => setShowEvento(s => !s)} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {showEvento ? 'Cancelar' : '+ Novo Evento'}
            </button>
          )}
        </div>

        {msgEvento && <div style={{ padding: '10px 16px', background: msgEvento.includes('sucesso') ? '#02A15320' : '#e6394620', border: `1px solid ${msgEvento.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msgEvento.includes('sucesso') ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14, marginBottom: 16 }}>{msgEvento}</div>}


        {/* Aba Eventos */}
        {abaGestor === 'eventos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {showEvento && (
              <form onSubmit={salvarEvento} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Novo Evento</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Título *</label>
                    <input required value={eventoForm.titulo} onChange={e => setEventoForm(p => ({ ...p, titulo: e.target.value }))} style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} /></div>
                  <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Cidade</label>
                    <input value={eventoForm.cidade} onChange={e => setEventoForm(p => ({ ...p, cidade: e.target.value }))} style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} /></div>
                  <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Data e Hora *</label>
                    <input required type="datetime-local" value={eventoForm.data_hora} onChange={e => setEventoForm(p => ({ ...p, data_hora: e.target.value }))} style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} /></div>
                  <div><label style={{ display: 'block', color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 4 }}>Descrição</label>
                    <input value={eventoForm.descricao} onChange={e => setEventoForm(p => ({ ...p, descricao: e.target.value }))} style={{ width: '100%', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={eventoForm.notificar} onChange={e => setEventoForm(p => ({ ...p, notificar: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--avp-green)' }} />
                  <span style={{ fontSize: 14, color: 'var(--avp-text)' }}>Notificar meus consultores via WhatsApp</span>
                </label>
                <button type="submit" disabled={salvandoEvento} style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-start', opacity: salvandoEvento ? 0.7 : 1 }}>
                  {salvandoEvento ? 'Salvando...' : 'Criar Evento'}
                </button>
              </form>
            )}
            {eventos.length === 0 && !showEvento && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 12, border: '1px solid var(--avp-border)' }}>Nenhum evento criado ainda.</div>
            )}
            {eventos.map(ev => (
              <div key={ev.id} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{ev.titulo}</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>
                    📅 {new Date(ev.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {ev.cidade && ` · 📍 ${ev.cidade}`}
                  </p>
                </div>
                <button onClick={() => removerEvento(ev.id)} style={{ background: 'var(--avp-danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remover</button>
              </div>
            ))}
          </div>
        )}

        {/* Aba Config */}
        {abaGestor === 'config' && (
          <div style={{ maxWidth: 500 }}>
            {whatsappWidget}
          </div>
        )}

        {/* Aba Consultores */}
        {abaGestor === 'consultores' && <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  {['Nome', 'WhatsApp', 'Progresso', 'Status', 'Cadastro', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listaConsultores.map(c => {
                  const pct = progressoMap[c.id] ?? 0
                  const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--avp-border)' }}>
                      <td onClick={() => abrirConsultor(c)} style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--avp-text)', fontSize: 14, cursor: 'pointer' }}>{c.nome}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.whatsapp}</td>
                      <td style={{ padding: '14px 16px', minWidth: 160 }}>{barraProgresso(pct)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '14px 16px' }}>
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
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor vinculado ao seu perfil.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>}
      </main>

      {consultorSelecionado && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && fecharModal()}
        >
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 16, padding: 32, width: 560, maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--avp-text)' }}>{consultorSelecionado.nome}</h2>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginTop: 2 }}>{consultorSelecionado.whatsapp} · {consultorSelecionado.email}</p>
              </div>
              <button onClick={fecharModal} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>×</button>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--avp-text)' }}>{m.titulo}</span>
                        <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>{m.aulas_concluidas}/{m.aulas_total} aulas</span>
                      </div>
                      <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${m.percentual}%`, background: cor, height: '100%', borderRadius: 100 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: m.percentual === 100 ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                          {m.percentual === 100 ? 'Concluído' : `${m.percentual}%`}
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
    </div>
  )
}
