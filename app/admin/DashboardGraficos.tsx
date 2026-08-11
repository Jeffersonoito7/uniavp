'use client'

type FunilProps = {
  nuncaAbriu: number
  cursando: number
  concluiu: number
  total: number
}

function GraficoRosca({ nuncaAbriu, cursando, concluiu, total }: FunilProps) {
  const r = 80
  const cx = 110
  const cy = 110
  const circunferencia = 2 * Math.PI * r

  const segmentos = [
    { valor: concluiu, cor: '#22c55e', label: 'Concluíram Módulo 1' },
    { valor: cursando, cor: '#f59e0b', label: 'Cursando' },
    { valor: nuncaAbriu, cor: '#ef4444', label: 'Nunca abriram' },
  ]

  let offset = 0
  const arcos = segmentos.map(s => {
    const pct = total > 0 ? s.valor / total : 0
    const comprimento = pct * circunferencia
    const resultado = { ...s, offset, comprimento, pct }
    offset += comprimento
    return resultado
  })

  const maiorIdx = segmentos.reduce((max, s, i) => s.valor > segmentos[max].valor ? i : max, 0)
  const maior = segmentos[maiorIdx]
  const maiorPct = total > 0 ? Math.round(maior.valor / total * 100) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
        <svg width={220} height={220} viewBox="0 0 220 220">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--avp-border)" strokeWidth={28} />
          {arcos.map((a, i) => (
            a.comprimento > 0 && (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={a.cor}
                strokeWidth={28}
                strokeDasharray={`${a.comprimento} ${circunferencia - a.comprimento}`}
                strokeDashoffset={-a.offset + circunferencia / 4}
                strokeLinecap="butt"
              />
            )
          ))}
          <circle cx={cx} cy={cy} r={54} fill="var(--avp-card)" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: maior.cor, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {maiorPct}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4, textAlign: 'center', maxWidth: 80, lineHeight: 1.3 }}>
            {maior.label}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 200 }}>
        {arcos.map((a, i) => {
          const pct = total > 0 ? Math.round(a.valor / total * 100) : 0
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: a.cor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--avp-text)', fontWeight: 500 }}>{a.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: a.cor, letterSpacing: '-0.02em' }}>{a.valor.toLocaleString('pt-BR')}</span>
                  <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', fontWeight: 500 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--avp-border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: a.cor,
                  width: `${pct}%`,
                }} />
              </div>
            </div>
          )
        })}
        <div style={{ paddingTop: 8, borderTop: '1px solid var(--avp-border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>Total cadastrados</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--avp-text)' }}>{total.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  )
}

type StatCardProps = {
  label: string
  valor: number | string
  sub: string
  cor: string
  pct?: number
}

function StatCard({ label, valor, sub, cor, pct }: StatCardProps) {
  const R = 20
  const circunf = 2 * Math.PI * R
  const arco = pct !== undefined ? (pct / 100) * circunf : 0

  return (
    <div style={{
      background: 'var(--avp-card)',
      border: '1px solid var(--avp-border)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {pct !== undefined && (
        <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={R} fill="none" stroke="var(--avp-border)" strokeWidth={5} />
            <circle
              cx={26} cy={26} r={R}
              fill="none"
              stroke={cor}
              strokeWidth={5}
              strokeDasharray={`${arco} ${circunf - arco}`}
              strokeDashoffset={circunf / 4}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: cor }}>{pct}%</span>
          </div>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--avp-text-dim)', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: cor, margin: '0 0 2px', letterSpacing: '-0.02em', lineHeight: 1 }}>{valor}</p>
        <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>{sub}</p>
      </div>
    </div>
  )
}

export function DashboardBI({
  totalAlunos,
  nuncaAbriu,
  cursandoMod1,
  concluiuMod1,
  gestoresAtivos,
  totalGestores,
  novosAlunos,
  alunosConcluidos,
}: {
  totalAlunos: number
  nuncaAbriu: number
  cursandoMod1: number
  concluiuMod1: number
  gestoresAtivos: number
  totalGestores: number
  novosAlunos: number
  alunosConcluidos: number
}) {
  const pctNunca = totalAlunos > 0 ? Math.round(nuncaAbriu / totalAlunos * 100) : 0
  const pctConcluiu = totalAlunos > 0 ? Math.round(concluiuMod1 / totalAlunos * 100) : 0
  const pctPro = totalGestores > 0 ? Math.round(gestoresAtivos / totalGestores * 100) : 0

  return (
    <>
      <div style={{
        background: 'var(--avp-card)',
        border: '1px solid var(--avp-border)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--avp-text-dim)', margin: '0 0 4px' }}>Engajamento com as aulas</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--avp-text)', margin: 0 }}>Visao geral dos {totalAlunos.toLocaleString('pt-BR')} alunos</p>
          </div>
          <a href="/admin/sem-acesso" style={{
            fontSize: 12, color: '#ef4444', textDecoration: 'none', fontWeight: 600,
            background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.25)',
          }}>
            Ver quem nunca acessou
          </a>
        </div>
        <GraficoRosca
          nuncaAbriu={nuncaAbriu}
          cursando={cursandoMod1}
          concluiu={concluiuMod1}
          total={totalAlunos}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Nunca abriram aula"
          valor={nuncaAbriu.toLocaleString('pt-BR')}
          sub={`${pctNunca}% do total cadastrado`}
          cor="#ef4444"
          pct={pctNunca}
        />
        <StatCard
          label="Concluiram Modulo 1"
          valor={concluiuMod1.toLocaleString('pt-BR')}
          sub="todas as aulas obrigatorias"
          cor="#22c55e"
          pct={pctConcluiu}
        />
        <StatCard
          label="PROs Ativos"
          valor={gestoresAtivos.toLocaleString('pt-BR')}
          sub={`de ${totalGestores} gestores`}
          cor="#3b82f6"
          pct={pctPro}
        />
        <StatCard
          label="Novos (7 dias)"
          valor={novosAlunos.toLocaleString('pt-BR')}
          sub="novos cadastros recentes"
          cor="#a855f7"
        />
      </div>
    </>
  )
}
