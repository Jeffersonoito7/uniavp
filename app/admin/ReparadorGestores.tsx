'use client'
import { useState } from 'react'

type Detalhe = string

export default function ReparadorGestores() {
  const [rodando, setRodando] = useState(false)
  const [resultado, setResultado] = useState<{ reparados: number; detalhes: Detalhe[]; mensagem?: string } | null>(null)
  const [erro, setErro] = useState('')

  async function reparar() {
    setRodando(true)
    setErro('')
    setResultado(null)
    try {
      const res = await fetch('/api/admin/reparar-gestores', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao reparar.'); return }
      setResultado(data)
    } catch {
      setErro('Falha na requisição.')
    } finally {
      setRodando(false)
    }
  }

  return (
    <div style={{ background: resultado?.reparados ? 'rgba(34,197,94,0.06)' : 'rgba(248,113,113,0.05)', border: `1px solid ${resultado?.reparados ? 'rgba(34,197,94,0.25)' : 'rgba(248,113,113,0.15)'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 3px', color: 'var(--avp-text)' }}>
          Reparar pagamentos confirmados sem ativacao
        </p>
        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: 0 }}>
          Detecta e ativa PROs que pagaram mas nao migraram por falha tecnica.
        </p>
        {resultado && (
          <div style={{ marginTop: 10 }}>
            {resultado.reparados > 0 ? (
              <p style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>
                {resultado.reparados} conta{resultado.reparados > 1 ? 's reparadas' : ' reparada'} e ativada{resultado.reparados > 1 ? 's' : ''} com sucesso.
              </p>
            ) : (
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '0 0 4px' }}>
                {resultado.mensagem ?? 'Nenhum caso pendente encontrado.'}
              </p>
            )}
            {resultado.detalhes?.filter(d => d.startsWith('OK')).map((d, i) => (
              <p key={i} style={{ fontSize: 12, color: '#4ade80', margin: '2px 0' }}>{d}</p>
            ))}
            {resultado.detalhes?.filter(d => d.startsWith('ERRO')).map((d, i) => (
              <p key={i} style={{ fontSize: 12, color: '#f87171', margin: '2px 0' }}>{d}</p>
            ))}
          </div>
        )}
        {erro && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{erro}</p>}
      </div>
      <button
        onClick={reparar}
        disabled={rodando}
        style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, cursor: rodando ? 'not-allowed' : 'pointer', fontSize: 13, flexShrink: 0, opacity: rodando ? 0.7 : 1, whiteSpace: 'nowrap' }}
      >
        {rodando ? 'Verificando...' : 'Reparar agora'}
      </button>
    </div>
  )
}
