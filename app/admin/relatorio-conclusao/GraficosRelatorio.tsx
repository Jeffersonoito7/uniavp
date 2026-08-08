'use client'

// ── Grafico de rosca (donut) ──────────────────────────────────────────────
export function GraficoRosca({
  fatias,
  titulo,
  centro,
}: {
  fatias: { label: string; valor: number; cor: string }[]
  titulo: string
  centro: string
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0)
  if (total === 0) return null

  const R = 70
  const r = 42
  const cx = 90
  const cy = 90

  let angulo = -Math.PI / 2
  const arcos = fatias.map((f) => {
    const theta = (f.valor / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(angulo)
    const y1 = cy + R * Math.sin(angulo)
    angulo += theta
    const x2 = cx + R * Math.cos(angulo)
    const y2 = cy + R * Math.sin(angulo)
    const xi1 = cx + r * Math.cos(angulo - theta)
    const xi2 = cx + r * Math.cos(angulo)
    const yi1 = cy + r * Math.sin(angulo - theta)
    const yi2 = cy + r * Math.sin(angulo)
    const large = theta > Math.PI ? 1 : 0
    const d = `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi2},${yi2} A${r},${r},0,${large},0,${xi1},${yi1} Z`
    return { ...f, d, pct: Math.round((f.valor / total) * 100) }
  })

  return (
    <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <svg width={180} height={180} style={{ flexShrink: 0 }}>
          {arcos.map((a, i) => (
            <path key={i} d={a.d} fill={a.cor} opacity={0.9} />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={800}>{centro}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11}>total</text>
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          {arcos.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: a.cor, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{a.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.valor} alunos ({a.pct}%)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Grafico de barras horizontais (funil) ─────────────────────────────────
export function GraficoFunil({
  itens,
  total,
  titulo,
}: {
  itens: { label: string; sub: string; valor: number; cor: string }[]
  total: number
  titulo: string
}) {
  return (
    <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{titulo}</p>
      {itens.map((it, i) => {
        const pct = total > 0 ? (it.valor / total) * 100 : 0
        return (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{it.label}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>{it.sub}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: it.cor }}>{it.valor}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: it.cor, borderRadius: 4, transition: 'width .4s' }} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{Math.round(pct)}% dos ativos</p>
          </div>
        )
      })}
    </div>
  )
}

// ── Grafico de barras verticais (conclusoes por mes) ──────────────────────
export function GraficoMeses({ meses }: { meses: [string, number][] }) {
  if (meses.length === 0) return null
  const max = Math.max(...meses.map(([, v]) => v), 1)
  const HEIGHT = 100

  const nomeMes = (mes: string) => {
    const [ano, m] = mes.split('-')
    return new Date(Number(ano), Number(m) - 1).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
  }

  // Mostrar os 6 mais recentes no grafico, todos na lista abaixo
  const visiveis = [...meses].reverse().slice(0, 6)

  return (
    <div style={{ background: '#0f1729', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conclusoes por mes</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: HEIGHT + 24, marginBottom: 20 }}>
        {visiveis.map(([mes, qtd]) => {
          const h = Math.max((qtd / max) * HEIGHT, 4)
          return (
            <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>{qtd}</span>
              <div style={{ width: '100%', height: h, background: 'linear-gradient(180deg,#4ade80,#16a34a)', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{nomeMes(mes)}</span>
            </div>
          )
        })}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        {meses.map(([mes, qtd]) => {
          const [ano, m] = mes.split('-')
          const label = new Date(Number(ano), Number(m) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
          return (
            <div key={mes} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{label}</span>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>{qtd} concluido{qtd > 1 ? 's' : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
