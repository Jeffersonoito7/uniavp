'use client'
import { useState } from 'react'

type Premio = {
  id: string
  nome: string
  descricao: string | null
  custo_pontos: number
  quantidade_disponivel: number | null
}

type Resgate = {
  id: string
  status: string
  created_at: string
  premio: { nome: string }
}

export default function LojaCliente({ saldoInicial, premios, resgatesIniciais, whatsapp }: { saldoInicial: number; premios: Premio[]; resgatesIniciais: Resgate[]; whatsapp: string }) {
  const [saldo, setSaldo] = useState(saldoInicial)
  const [resgates, setResgates] = useState<Resgate[]>(resgatesIniciais)
  const [carregando, setCarregando] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)

  async function resgatar(premioId: string) {
    setCarregando(premioId)
    const res = await fetch('/api/loja/resgatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premio_id: premioId }),
    })
    const data = await res.json()
    if (data.ok) {
      setSaldo(data.saldo_restante)
      setMsg({ tipo: 'ok', texto: 'Resgate realizado! Aguarde a aprovação do admin.' })
      setResgates(r => [{ id: data.id, status: 'pendente', created_at: new Date().toISOString(), premio: { nome: premios.find(p => p.id === premioId)?.nome ?? '' } }, ...r])
    } else {
      setMsg({ tipo: 'err', texto: data.error ?? 'Erro ao resgatar.' })
    }
    setCarregando(null)
    setTimeout(() => setMsg(null), 5000)
  }

  const cardStyle = { background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }
  const statusColor: Record<string, string> = { pendente: '#f59e0b', aprovado: 'var(--avp-blue)', entregue: 'var(--avp-green)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {msg && (
        <div style={{ padding: '12px 16px', background: msg.tipo === 'ok' ? '#02A15320' : '#e6394620', border: `1px solid ${msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)'}`, borderRadius: 8, color: msg.tipo === 'ok' ? 'var(--avp-green)' : 'var(--avp-danger)', fontSize: 14 }}>
          {msg.texto}
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Prêmios disponíveis</h2>
        {premios.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum prêmio disponível no momento.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {premios.map(p => {
            const podeResgatar = saldo >= p.custo_pontos && (p.quantidade_disponivel === null || p.quantidade_disponivel > 0)
            return (
              <div key={p.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 16 }}>{p.nome}</h3>
                    <span style={{ background: 'var(--avp-green)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{p.custo_pontos} pts</span>
                  </div>
                  {p.descricao && <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 12 }}>{p.descricao}</p>}
                  {p.quantidade_disponivel !== null && <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 12 }}>Estoque: {p.quantidade_disponivel}</p>}
                </div>
                <button
                  onClick={() => resgatar(p.id)}
                  disabled={!podeResgatar || carregando === p.id}
                  style={{ background: podeResgatar ? 'var(--avp-blue)' : 'var(--avp-border)', color: podeResgatar ? '#fff' : 'var(--avp-text-dim)', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: podeResgatar ? 'pointer' : 'not-allowed', fontSize: 14, transition: 'all 0.15s' }}
                >
                  {carregando === p.id ? 'Resgatando...' : podeResgatar ? 'Resgatar' : `Faltam ${p.custo_pontos - saldo} pts`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Meus resgates</h2>
        {resgates.length === 0 && <p style={{ color: 'var(--avp-text-dim)', fontSize: 14 }}>Nenhum resgate realizado ainda.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resgates.map(r => (
            <div key={r.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{r.premio?.nome}</p>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <span style={{ background: statusColor[r.status] + '20', color: statusColor[r.status], borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
