'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ThemeToggle from '@/app/components/ThemeToggle'
import EventosWidget from '@/app/components/EventosWidget'
import MuralNoticias from '@/app/components/MuralNoticias'

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
}: {
  gestor: Gestor
  consultores: Consultor[]
  progressoMap: Record<string, number>
}) {
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [consultorSelecionado, setConsultorSelecionado] = useState<Consultor | null>(null)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [carregandoModulos, setCarregandoModulos] = useState(false)

  const totalConsultores = consultores.length
  const emAndamento = consultores.filter(c => c.status === 'ativo' && progressoMap[c.id] > 0).length
  const concluidos = consultores.filter(c => c.status === 'concluido').length

  async function sair() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function copiarLink() {
    const url = `${window.location.origin}/captacao`
    navigator.clipboard.writeText(url)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total de consultores', value: totalConsultores },
            { label: 'Em andamento', value: emAndamento },
            { label: 'Concluídos', value: concluidos },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24 }}>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 8 }}>{stat.label}</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--avp-text)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={copiarLink}
            style={{ background: linkCopiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, transition: 'background 0.2s' }}
          >
            {linkCopiado ? 'Link copiado!' : 'Cadastrar novo consultor'}
          </button>
        </div>

        <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--avp-border)' }}>
                  {['Nome', 'WhatsApp', 'Progresso', 'Status', 'Cadastro'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultores.map(c => {
                  const pct = progressoMap[c.id] ?? 0
                  const badge = badgeStatus[c.status] ?? { label: c.status, color: 'var(--avp-text-dim)', bg: 'var(--avp-border)' }
                  return (
                    <tr
                      key={c.id}
                      onClick={() => abrirConsultor(c)}
                      style={{ borderBottom: '1px solid var(--avp-border)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--avp-border)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--avp-text)', fontSize: 14 }}>{c.nome}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 14 }}>{c.whatsapp}</td>
                      <td style={{ padding: '14px 16px', minWidth: 160 }}>{barraProgresso(pct)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--avp-text-dim)', fontSize: 13 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  )
                })}
                {consultores.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--avp-text-dim)' }}>Nenhum consultor vinculado ao seu perfil.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
