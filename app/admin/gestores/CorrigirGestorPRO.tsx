'use client'
import { useState } from 'react'

type Pagamento = { id: string; status: string; valor: number; plano_meses: number; criado_em: string; pago_em: string | null }
type Resultado = {
  gestor: { id: string; nome: string; email: string; whatsapp: string }
  status_antes: string
  vencimento_antes: string | null
  estava_ativo: boolean
  pagamentos: Pagamento[]
  corrigido: boolean
  acao: string
}

export default function CorrigirGestorPRO() {
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<Resultado[] | null>(null)
  const [erro, setErro] = useState('')

  async function verificar() {
    if (!busca.trim()) return
    setLoading(true)
    setErro('')
    setResultados(null)
    const res = await fetch('/api/admin/gestores/corrigir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busca }),
    })
    const json = await res.json()
    if (!res.ok) {
      setErro(json.erro ?? json.error ?? 'Erro desconhecido')
    } else {
      setResultados(json.resultados)
    }
    setLoading(false)
  }

  const corCor = (s: string) => ({ ativo: '#4ade80', free: '#f87171', suspenso: '#f87171', trial: '#fbbf24' }[s] ?? '#94a3b8')
  const corPago = (s: string) => s === 'pago' ? '#4ade80' : s === 'pendente' ? '#fbbf24' : '#94a3b8'

  return (
    <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 12, padding: '20px 22px', marginBottom: 28 }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Corrigir gestor PRO</p>
      <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '0 0 14px' }}>
        Use quando um gestor pagou mas continua vendo "Plano PRO encerrado". Busque pelo nome, WhatsApp ou e-mail.
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verificar()}
          placeholder="Nome, WhatsApp ou e-mail do gestor"
          style={{ flex: 1, background: 'var(--avp-black)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '10px 12px', color: 'var(--avp-text)', fontSize: 14, outline: 'none' }}
        />
        <button
          onClick={verificar}
          disabled={loading || !busca.trim()}
          style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Verificando...' : 'Verificar e Corrigir'}
        </button>
      </div>

      {erro && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#f87171' }}>{erro}</p>
      )}

      {resultados && resultados.map(r => (
        <div key={r.gestor.id} style={{ marginTop: 16, background: 'var(--avp-card)', borderRadius: 10, padding: '16px 18px', border: r.corrigido ? '1px solid rgba(74,222,128,0.4)' : '1px solid var(--avp-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--avp-text)', margin: '0 0 2px' }}>{r.gestor.nome}</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>{r.gestor.email} · {r.gestor.whatsapp}</p>
            </div>
            {r.corrigido ? (
              <span style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Corrigido
              </span>
            ) : r.estava_ativo ? (
              <span style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Ja estava ativo
              </span>
            ) : (
              <span style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Sem pagamento pago para corrigir
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Status antes</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: corCor(r.status_antes) }}>{r.status_antes}</span>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Vencimento antes</p>
              <span style={{ fontSize: 13, color: 'var(--avp-text)' }}>
                {r.vencimento_antes ? new Date(r.vencimento_antes).toLocaleDateString('pt-BR') : 'sem data'}
              </span>
            </div>
            {r.corrigido && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: '0 0 2px' }}>Acao realizada</p>
                <span style={{ fontSize: 13, color: '#4ade80' }}>{r.acao}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', margin: '8px 0 6px' }}>Pagamentos ({r.pagamentos.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {r.pagamentos.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Nenhum pagamento encontrado.</p>
            )}
            {r.pagamentos.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 10px', background: 'var(--avp-border)', borderRadius: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: corPago(p.status), width: 70 }}>{p.status}</span>
                <span style={{ color: 'var(--avp-text)' }}>R$ {Number(p.valor ?? 0).toFixed(2)}</span>
                <span style={{ color: 'var(--avp-text-dim)' }}>{p.plano_meses} mes{p.plano_meses > 1 ? 'es' : ''}</span>
                <span style={{ color: 'var(--avp-text-dim)', marginLeft: 'auto' }}>
                  {p.pago_em ? `Pago em ${new Date(p.pago_em).toLocaleDateString('pt-BR')}` : `Criado em ${new Date(p.criado_em).toLocaleDateString('pt-BR')}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
