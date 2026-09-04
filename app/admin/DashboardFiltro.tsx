'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

const PERIODOS = [
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: '3_meses', label: 'Últimos 3 meses' },
  { value: '6_meses', label: 'Últimos 6 meses' },
  { value: 'ano_atual', label: 'Este ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

export default function DashboardFiltro({ periodoAtual, inicioAtual, fimAtual }: {
  periodoAtual: string; inicioAtual?: string; fimAtual?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [periodo, setPeriodo] = useState(periodoAtual)
  const [inicio, setInicio] = useState(inicioAtual ?? '')
  const [fim, setFim] = useState(fimAtual ?? '')

  function navegar(p: string, ini: string, f: string) {
    const params = new URLSearchParams()
    params.set('periodo', p)
    if (p === 'personalizado') {
      if (ini) params.set('inicio', ini)
      if (f) params.set('fim', f)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function onChangePeriodo(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value
    setPeriodo(novo)
    if (novo !== 'personalizado') navegar(novo, inicio, fim)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20, padding: '14px 18px', background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Período</p>
      <select value={periodo} onChange={onChangePeriodo}
        style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--avp-border)', background: 'var(--avp-bg)', color: 'var(--avp-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      {periodo === 'personalizado' && (
        <>
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--avp-border)', background: 'var(--avp-bg)', color: 'var(--avp-text)', fontSize: 13 }} />
          <span style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>até</span>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--avp-border)', background: 'var(--avp-bg)', color: 'var(--avp-text)', fontSize: 13 }} />
          <button onClick={() => navegar(periodo, inicio, fim)}
            style={{ padding: '7px 16px', borderRadius: 8, background: '#818cf8', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Aplicar
          </button>
        </>
      )}
    </div>
  )
}
