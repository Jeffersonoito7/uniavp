type Nivel = { nome: string; prox: number | null; atual: number; min: number; max: number }

type Props = {
  whatsapp: string
  nivel: Nivel
  totalPontos: number
  progressoPct: number
  progressoGeral: number
  aulasConcluidas: number
  totalAulas: number
  streakAtual: number | null
  maiorStreak: number | null
  medalhas: { icone: string; nome: string }[]
  mostrarCarteira: boolean
}

export default function AlunoStats({
  whatsapp, nivel, totalPontos, progressoPct, progressoGeral,
  aulasConcluidas, totalAulas, streakAtual, maiorStreak, medalhas, mostrarCarteira,
}: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
      {/* Nível */}
      <div style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 14, padding: 20 }}>
        <p style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Nível</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 4 }}>{nivel.nome}</p>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>
          {totalPontos} pts{nivel.prox ? ` · próximo: ${nivel.prox}` : ' · Máximo!'}
        </p>
        <div style={{ marginTop: 10, background: 'var(--avp-border)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progressoPct}%`, height: '100%', background: '#4f46e5', borderRadius: 100 }} />
        </div>
      </div>

      {/* Progresso geral */}
      <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: 20 }}>
        <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Progresso Geral</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 4 }}>{progressoGeral}%</p>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>{aulasConcluidas} de {totalAulas} aulas concluídas</p>
        <div style={{ marginTop: 10, background: 'var(--avp-border)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progressoGeral}%`, height: '100%', background: '#22c55e', borderRadius: 100 }} />
        </div>
      </div>

      {/* Streak */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20 }}>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Sequência de Estudos</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 2 }}>
          {(streakAtual ?? 0) >= 1 ? '🔥' : '💤'} {streakAtual ?? 0} {streakAtual === 1 ? 'dia' : 'dias'}
        </p>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>
          Recorde: {maiorStreak ?? 0} {(maiorStreak ?? 0) === 1 ? 'dia' : 'dias'} consecutivos
        </p>
      </div>

      {/* Medalhas */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20 }}>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Medalhas</p>
        {medalhas.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {medalhas.map((m, i) => (
              <div key={i} title={m.nome} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--avp-black)', border: '1px solid var(--avp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {m.icone}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Complete aulas para ganhar medalhas!</p>
        )}
      </div>

      {/* Atalhos mobile */}
      <div className="hide-desktop" style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: 20 }}>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Acessar</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { href: `/aluno/${whatsapp}/forum`, label: '💬 Fórum' },
            { href: `/aluno/${whatsapp}/loja`, label: '🛍️ Loja' },
            { href: `/aluno/${whatsapp}/perfil`, label: '👤 Perfil' },
            ...(mostrarCarteira ? [{ href: `/aluno/${whatsapp}/carteira`, label: '🎓 Carteira' }] : []),
          ].map(l => (
            <a key={l.href} href={l.href} style={{ color: 'var(--avp-text)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
