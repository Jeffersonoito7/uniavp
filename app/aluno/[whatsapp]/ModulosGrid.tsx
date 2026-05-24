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
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--avp-text-dim)', background: 'var(--avp-card)', borderRadius: 16, border: '1px solid var(--avp-border)' }}>
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

        const cardStyle = {
          background: 'var(--avp-card)',
          border: `1px solid ${eProExclusivo ? 'rgba(79,70,229,0.3)' : todasConcluidas ? '#22c55e40' : temDisponivel ? 'rgba(79,70,229,0.2)' : 'var(--avp-border)'}`,
          borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column' as const,
          textDecoration: 'none', color: 'inherit',
        }

        const conteudo = (
          <>
            <div style={{ height: 180, background: eProExclusivo ? 'rgba(79,70,229,0.15)' : 'rgba(79,70,229,0.1)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              {thumb && (
                <img src={thumb} alt={mod.modulo_titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, filter: eProExclusivo ? 'blur(3px)' : 'none', opacity: eProExclusivo ? 0.4 : 1 }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: eProExclusivo ? 'rgba(15,15,23,0.65)' : 'rgba(0,0,0,0.25)' }} />
              {eProExclusivo && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="28" height="28" fill="none" stroke="#818cf8" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  <div style={{ background: 'rgba(79,70,229,0.8)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>EXCLUSIVO PRO</div>
                </div>
              )}
              {!eProExclusivo && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: todasConcluidas ? '#22c55e' : 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {todasConcluidas ? '✓ Concluído' : `${concluidas}/${total} aulas`}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, color: eProExclusivo ? '#818cf8' : 'var(--avp-text)', margin: 0 }}>{mod.modulo_titulo}</p>
              {!eProExclusivo && (
                <div>
                  <div style={{ background: 'var(--avp-border)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: todasConcluidas ? '#22c55e' : '#4f46e5', borderRadius: 100, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', marginTop: 4 }}>{pct}% concluído</p>
                </div>
              )}
              {eProExclusivo
                ? <a href="/upgrade" className="btn btn-primary btn-full" style={{ textDecoration: 'none', marginTop: 'auto' }}>Desbloquear — Ser PRO</a>
                : <div className="btn btn-full" style={{ background: todasConcluidas ? '#22c55e' : temDisponivel ? '#4f46e5' : 'var(--avp-border)', color: (todasConcluidas || temDisponivel) ? '#fff' : 'var(--avp-text-dim)', marginTop: 'auto' }}>
                    {todasConcluidas ? '✓ Rever módulo' : temDisponivel ? '▶ Acessar' : 'Bloqueado'}
                  </div>
              }
            </div>
          </>
        )

        return eProExclusivo
          ? <div key={mod.modulo_id} style={cardStyle}>{conteudo}</div>
          : <Link key={mod.modulo_id} href={`/aluno/${whatsapp}?modulo=${mod.modulo_id}`} style={cardStyle}>{conteudo}</Link>
      })}
    </div>
  )
}
