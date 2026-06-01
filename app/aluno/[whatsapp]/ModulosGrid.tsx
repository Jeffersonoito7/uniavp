import Link from 'next/link'
import type { ModuloComAulas } from './types'

type Props = {
  modulos: ModuloComAulas[]
  whatsapp: string
  capaDefault: string | null
}

export default function ModulosGrid({ modulos, whatsapp, capaDefault }: Props) {
  if (modulos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 20, border: '1px solid var(--avp-border)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="48" height="48" fill="none" stroke="var(--avp-text-dim)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p style={{ fontSize: 16 }}>Nenhuma aula disponível no momento.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Em breve novos conteúdos serão liberados!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
      {modulos.map(mod => {
        const eProExclusivo = mod.apenasProPermissao
        const concluidas = mod.aulas.filter(a => a.status === 'concluida').length
        const total = mod.aulas.length
        const pct = total > 0 ? Math.round(concluidas / total * 100) : 0
        const temDisponivel = !eProExclusivo && mod.aulas.some(a => a.status === 'disponivel')
        const todasConcluidas = !eProExclusivo && concluidas === total && total > 0
        const thumb = mod.aulas[0]?.capa_url
          || (mod.aulas[0]?.youtube_video_id ? `https://img.youtube.com/vi/${mod.aulas[0].youtube_video_id}/mqdefault.jpg` : null)
          || capaDefault

        const borderColor = eProExclusivo
          ? 'rgba(79,70,229,0.35)'
          : todasConcluidas
          ? 'rgba(34,197,94,0.4)'
          : temDisponivel
          ? 'rgba(79,70,229,0.25)'
          : 'var(--avp-border)'

        const cardStyle = {
          background: 'var(--avp-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' as const,
          textDecoration: 'none',
          color: 'inherit',
          boxShadow: todasConcluidas
            ? '0 4px 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
        }

        const conteudo = (
          <>
            <div style={{ height: 185, background: eProExclusivo ? 'rgba(79,70,229,0.12)' : 'rgba(15,15,30,0.8)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {thumb && (
                <img src={thumb} alt={mod.modulo_titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: eProExclusivo ? 'blur(4px) saturate(0.5)' : 'none', opacity: eProExclusivo ? 0.35 : 1, transition: 'transform 0.4s ease' }} />
              )}
              {/* Gradient overlay */}
              <div style={{ position: 'absolute', inset: 0, background: eProExclusivo ? 'linear-gradient(180deg, rgba(10,10,20,0.4) 0%, rgba(10,10,20,0.85) 100%)' : 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />

              {eProExclusivo && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(79,70,229,0.25)', border: '1px solid rgba(79,70,229,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.9), rgba(124,58,237,0.9))', borderRadius: 20, padding: '5px 16px', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>
                    EXCLUSIVO PRO
                  </div>
                </div>
              )}

              {!eProExclusivo && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: todasConcluidas ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff', border: todasConcluidas ? 'none' : '1px solid rgba(255,255,255,0.1)', boxShadow: todasConcluidas ? '0 4px 12px rgba(34,197,94,0.4)' : 'none' }}>
                  {todasConcluidas ? '✓ Concluído' : `${concluidas}/${total} aulas`}
                </div>
              )}

              {/* Título no thumbnail se tiver imagem */}
              {thumb && !eProExclusivo && (
                <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {mod.modulo_titulo}
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Título (só mostra abaixo se não tiver thumb) */}
              {!thumb && (
                <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: eProExclusivo ? '#818cf8' : 'var(--avp-text)', margin: 0 }}>{mod.modulo_titulo}</p>
              )}
              {thumb && eProExclusivo && (
                <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: '#818cf8', margin: 0 }}>{mod.modulo_titulo}</p>
              )}

              {!eProExclusivo && (
                <div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: todasConcluidas ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: 100, boxShadow: todasConcluidas ? '0 0 6px rgba(74,222,128,0.5)' : '0 0 6px rgba(129,140,248,0.5)', transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 5 }}>{pct}% concluído</p>
                </div>
              )}

              {eProExclusivo
                ? <a href="/upgrade" className="btn btn-primary btn-full" style={{ textDecoration: 'none', marginTop: 'auto', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.35)' }}>Desbloquear — Ser PRO</a>
                : <div className="btn btn-full" style={{
                    background: todasConcluidas
                      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                      : temDisponivel
                      ? 'linear-gradient(135deg, #4338ca, #4f46e5)'
                      : 'var(--avp-border)',
                    color: (todasConcluidas || temDisponivel) ? '#fff' : 'var(--avp-text-dim)',
                    marginTop: 'auto',
                    boxShadow: todasConcluidas
                      ? '0 4px 16px rgba(34,197,94,0.3)'
                      : temDisponivel
                      ? '0 4px 16px rgba(79,70,229,0.3)'
                      : 'none',
                  }}>
                  {todasConcluidas ? '✓ Rever módulo' : temDisponivel ? '▶ Acessar' : 'Bloqueado'}
                </div>
              }
            </div>
          </>
        )

        return eProExclusivo
          ? <div key={mod.modulo_id} className="modulo-card" style={cardStyle}>{conteudo}</div>
          : <Link key={mod.modulo_id} href={`/aluno/${whatsapp}?modulo=${mod.modulo_id}`} className="modulo-card" style={cardStyle}>{conteudo}</Link>
      })}
    </div>
  )
}
