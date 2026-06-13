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
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>

 {/* Nível */}
 <div className="stat-card stat-card-blue">
 <div className="stat-glow-blue" />
 <p className="stat-label-blue" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Nível</p>
 <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 4, lineHeight: 1.1, position: 'relative' }}>{nivel.nome}</p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, marginBottom: 12 }}>
 {totalPontos} pts{nivel.prox ? ` · meta: ${nivel.prox}` : ' · máximo!'}
 </p>
 <div style={{ background: 'rgba(79,70,229,0.18)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
 <div style={{ width: `${progressoPct}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: 100, boxShadow: '0 0 8px rgba(129,140,248,0.6)' }} />
 </div>
 </div>

 {/* Progresso geral */}
 <div className="stat-card stat-card-green">
 <div className="stat-glow-green" />
 <p className="stat-label-green" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Progresso</p>
 <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 4, lineHeight: 1, position: 'relative' }}>{progressoGeral}<span style={{ fontSize: 16 }}>%</span></p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 11, marginBottom: 12 }}>{aulasConcluidas} de {totalAulas} aulas</p>
 <div style={{ background: 'rgba(34,197,94,0.18)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
 <div style={{ width: `${progressoGeral}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #4ade80)', borderRadius: 100, boxShadow: '0 0 8px rgba(74,222,128,0.5)' }} />
 </div>
 </div>

 {/* Streak */}
 <div className="stat-card stat-card-base" style={{ position: 'relative', overflow: 'hidden' }}>
 {(streakAtual ?? 0)>= 3 && <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />}
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Sequência</p>
 <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--avp-text)', marginBottom: 4, lineHeight: 1 }}>
 {(streakAtual ?? 0)>= 1 ? '' : ''} {streakAtual ?? 0}
 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--avp-text-dim)', marginLeft: 4 }}>dias</span>
 </p>
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 11 }}>Recorde: {maiorStreak ?? 0} dias</p>
 </div>

 {/* Medalhas */}
 <div className="stat-card stat-card-base">
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Medalhas</p>
 {medalhas.length> 0 ? (
 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
 {medalhas.map((m, i) => (
 <div key={i} title={m.nome} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
 {m.icone}
 </div>
 ))}
 </div>
 ) : (
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>Complete aulas para ganhar medalhas!</p>
 )}
 </div>

 {/* Atalhos mobile */}
 <div className="hide-desktop stat-card stat-card-base">
 <p style={{ color: 'var(--avp-text-dim)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Acessar</p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {[
 { href: `/aluno/${whatsapp}/forum`, label: ' Fórum' },
 { href: `/aluno/${whatsapp}/loja`, label: ' Loja' },
 { href: `/aluno/${whatsapp}/perfil`, label: ' Perfil' },
 ...(mostrarCarteira ? [{ href: `/aluno/${whatsapp}/carteira`, label: ' Carteira' }] : []),
 ].map(l => (
 <a key={l.href} href={l.href} style={{ color: 'var(--avp-text)', fontSize: 13, textDecoration: 'none', fontWeight: 600, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--avp-border)' }}>{l.label}</a>
 ))}
 </div>
 </div>
 </div>
 )
}
