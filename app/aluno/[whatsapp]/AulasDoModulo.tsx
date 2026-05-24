import Link from 'next/link'
import type { ModuloComAulas, TrilhaItem } from './types'

type Props = {
  moduloAtivo: ModuloComAulas
  whatsapp: string
}

function getStatusRecertificacao(item: TrilhaItem): boolean {
  if (item.status !== 'concluida') return false
  if (!item.validade_meses || item.validade_meses === 0) return false
  if (!item.progresso_created_at) return false
  const expira = new Date(item.progresso_created_at)
  expira.setMonth(expira.getMonth() + item.validade_meses)
  return new Date() > expira
}

export default function AulasDoModulo({ moduloAtivo, whatsapp }: Props) {
  const concluidas = moduloAtivo.aulas.filter(a => a.status === 'concluida').length

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--avp-border)' }}>
        <Link href={`/aluno/${whatsapp}`}
          style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '7px 14px', color: 'var(--avp-text-dim)', textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          ← Módulos
        </Link>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{moduloAtivo.modulo_titulo}</h2>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, margin: '3px 0 0' }}>
            {concluidas}/{moduloAtivo.aulas.length} aulas concluídas
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {moduloAtivo.aulas.map(aula => {
          const recertNeeded = getStatusRecertificacao(aula)
          const isPro = moduloAtivo.apenasProPermissao
          const isDisponivel = !isPro && aula.status === 'disponivel'
          const isConcluida = aula.status === 'concluida'
          const isBloqueada = !isPro && aula.status === 'bloqueada'

          return (
            <div key={aula.aula_id} style={{
              background: 'var(--avp-card)',
              border: `1px solid ${isPro ? 'rgba(79,70,229,0.25)' : isConcluida ? '#22c55e30' : isDisponivel ? 'rgba(79,70,229,0.2)' : 'var(--avp-border)'}`,
              borderRadius: 12, overflow: 'hidden',
              opacity: isBloqueada ? 0.55 : 1,
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Thumbnail */}
              <div style={{ height: 130, position: 'relative', background: isPro ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                {(aula.capa_url || aula.youtube_video_id) && (
                  <img
                    src={aula.capa_url || `https://img.youtube.com/vi/${aula.youtube_video_id}/mqdefault.jpg`}
                    alt={aula.aula_titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: isPro ? 'blur(2.5px)' : 'none', opacity: isPro ? 0.4 : 1 }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: isPro ? 'rgba(15,15,23,0.65)' : 'rgba(0,0,0,0.25)' }} />
                {isPro && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(79,70,229,0.8)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                    EXCLUSIVO PRO
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPro ? (
                    <div style={{ textAlign: 'center' }}>
                      <svg width="28" height="28" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      <p style={{ color: '#818cf8', fontSize: 11, fontWeight: 600, margin: '6px 0 0' }}>Apenas no PRO</p>
                    </div>
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: isConcluida ? '#22c55e' : isDisponivel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: isDisponivel ? '#1e40af' : '#fff' }}>
                      {isConcluida ? '✓' : isDisponivel ? '▶' : ''}
                    </div>
                  )}
                </div>
                {recertNeeded && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#f59e0b', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#000' }}>
                    RECERT.
                  </div>
                )}
              </div>

              {/* Info + botão */}
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, color: isPro ? '#818cf8' : 'var(--avp-text)', margin: 0, flex: 1 }}>{aula.aula_titulo}</p>

                {(isConcluida || isDisponivel) && aula.quiz_aprovacao_minima != null && aula.quiz_aprovacao_minima > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>
                    Mínimo: <strong style={{ color: isConcluida ? 'var(--avp-green)' : 'var(--avp-text)' }}>{aula.quiz_aprovacao_minima}%</strong>
                    {aula.melhor_percentual != null && (
                      <> · Melhor: <strong style={{ color: aula.melhor_percentual >= (aula.quiz_aprovacao_minima ?? 0) ? 'var(--avp-green)' : '#f59e0b' }}>{aula.melhor_percentual}%</strong></>
                    )}
                  </p>
                )}
                {isBloqueada && <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', margin: 0 }}>Complete a aula anterior</p>}
                {aula.status === 'aguardando_tempo' && aula.liberada_em && (
                  <p style={{ fontSize: 11, color: '#f59e0b', margin: 0 }}>
                    ⏳ {new Date(aula.liberada_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {isPro ? (
                  <a href="/upgrade" className="btn btn-primary btn-full" style={{ textDecoration: 'none' }}>
                    Desbloquear — Ser Pro
                  </a>
                ) : (isDisponivel || isConcluida) ? (
                  <Link href={`/aluno/${whatsapp}/aula/${aula.aula_id}`}
                    className="btn btn-full"
                    style={{ background: isConcluida && !recertNeeded ? 'var(--avp-border)' : '#4f46e5', color: isConcluida && !recertNeeded ? 'var(--avp-text-dim)' : '#fff', textDecoration: 'none' }}>
                    {isConcluida && !recertNeeded ? 'Rever' : '▶ Acessar'}
                  </Link>
                ) : (
                  <div style={{ textAlign: 'center', background: 'var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 8, padding: '9px', fontSize: 14, fontWeight: 700 }}>
                    {aula.status === 'aguardando_tempo' ? 'Aguardando' : 'Bloqueada'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
