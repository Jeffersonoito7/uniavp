'use client'

type Props = {
  nomeAluno: string
  numRegistro: string
  whatsapp: string
  onClose: () => void
}

export default function CarteiraPopup({ nomeAluno, numRegistro, whatsapp, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', textAlign: 'center' }}>

        <div style={{ fontSize: 56, marginBottom: 8 }}>🪪</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: '#fbbf24' }}>
          Sua Carteirinha está pronta!
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          Consultor <strong style={{ color: 'var(--avp-text)' }}>{nomeAluno}</strong><br />
          Registro nº <strong style={{ color: '#fbbf24' }}>{numRegistro}</strong>
        </p>

        {/* Preview card estático */}
        <div style={{ background: '#0D2B6E', borderRadius: 12, padding: '18px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
          {/* Guilloché mini */}
          <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width="100%" height="100%">
            {Array.from({ length: 6 }).map((_, i) => (
              <ellipse key={i} cx="50%" cy="50%" rx={`${15 + i * 12}%`} ry={`${20 + i * 8}%`} fill="none" stroke="#fff" strokeWidth="0.5" />
            ))}
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
            <div style={{ textAlign: 'center' as const }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 13, margin: 0, letterSpacing: 1.5 }}>CARTEIRA DE FORMAÇÃO</p>
              <p style={{ color: '#0A7A42', fontSize: 9, margin: '2px 0 0', fontWeight: 700, letterSpacing: 1.5 }}>CONSULTOR CERTIFICADO</p>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10, position: 'relative' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, margin: '0 0 2px', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' as const }}>Nome do Consultor</p>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0 }}>{nomeAluno}</p>
          </div>
          <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, margin: '0 0 2px', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' as const }}>Nº Registro</p>
              <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 800, margin: 0 }}>{numRegistro}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, margin: '0 0 2px', letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' as const }}>Formação</p>
              <p style={{ color: '#fff', fontSize: 11, fontWeight: 600, margin: 0 }}>Consultor AVP</p>
            </div>
          </div>
          <div style={{ background: '#0A7A42', borderRadius: 6, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <p style={{ color: '#fff', fontSize: 9, fontWeight: 700, margin: 0, letterSpacing: 1 }}>VÁLIDA EM TODO TERRITÓRIO NACIONAL</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8, margin: 0 }}>QR de verificação incluso</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={`/aluno/${whatsapp}/carteira`}
            target="_blank"
            rel="noreferrer"
            style={{ background: '#fbbf24', color: '#1a1a1a', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
          >
            🪪 Abrir e Imprimir Carteirinha
          </a>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontSize: 14 }}
          >
            Fechar
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 14 }}>
          💡 Na carteirinha você pode adicionar sua foto 3x4 e salvar como PDF
        </p>
      </div>
    </div>
  )
}
