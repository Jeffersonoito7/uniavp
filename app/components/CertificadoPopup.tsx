'use client'

type Props = {
  nomeAluno: string
  templateUrl: string
  onClose: () => void
}

export default function CertificadoPopup({ nomeAluno, templateUrl, onClose }: Props) {
  function baixar() {
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = `certificado-avp.png`
    link.target = '_blank'
    link.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 32, maxWidth: 780, width: '100%', textAlign: 'center' }}>

        <div style={{ fontSize: 56, marginBottom: 8 }}>🎓</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Parabéns, {nomeAluno.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>
          Você concluiu 100% da formação! 🏆✨<br />
          <strong style={{ color: 'var(--avp-text)' }}>Baixe seu certificado abaixo.</strong>
        </p>

        {/* Preview do certificado */}
        <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)' }}>
          <img
            src={templateUrl}
            alt="Certificado de Conclusão"
            style={{ width: '100%', display: 'block', objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={baixar}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            ⬇️ Baixar Certificado
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontSize: 14 }}>
            Fechar
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 14 }}>
          💡 Alta resolução — ideal para imprimir em A4 paisagem
        </p>
      </div>
    </div>
  )
}
