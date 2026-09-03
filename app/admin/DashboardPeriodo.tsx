'use client'

export default function DashboardPeriodo({ meses }: { meses: { label: string; total: number }[] }) {
  const max = Math.max(...meses.map(m => m.total), 1)
  const H = 120, W = 400, barW = Math.floor(W / meses.length) - 8

  return (
    <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--avp-text-dim)', marginBottom: 14 }}>Novos cadastros por mês</p>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', maxWidth: W, overflow: 'visible' }}>
        {meses.map((m, i) => {
          const x = i * (W / meses.length) + 4
          const barH = Math.round((m.total / max) * H)
          const y = H - barH
          return (
            <g key={m.label}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill="#818cf8" opacity={0.85} />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="var(--avp-text)" fontSize={10} fontWeight={700}>{m.total > 0 ? m.total : ''}</text>
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fill="var(--avp-text-dim)" fontSize={10}>{m.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
