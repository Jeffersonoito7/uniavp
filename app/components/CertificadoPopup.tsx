'use client'
import { useRef, useState } from 'react'

type Props = {
  nomeAluno: string
  templateUrl: string
  nomeY?: number        // % da altura, padrão 63
  nomeFontePct?: number // % da largura como fonte, padrão 0.048
  nomeCor?: string
  onClose: () => void
  onVerCarteira?: () => void
}

export default function CertificadoPopup({ nomeAluno, templateUrl, nomeY = 63, nomeFontePct = 0.048, nomeCor = '#1a1a1a', onClose, onVerCarteira }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [baixando, setBaixando] = useState(false)
  const [imgCarregada, setImgCarregada] = useState(false)

  async function baixar() {
    setBaixando(true)
    try {
      // Canvas apenas no download — usa proxy para CORS
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej()
        img.src = `/api/proxy-image?url=${encodeURIComponent(templateUrl)}`
        setTimeout(() => rej(), 12000)
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const fontSize = Math.round(img.naturalWidth * nomeFontePct)
      ctx.font = `700 ${fontSize}px Georgia, serif`
      ctx.fillStyle = nomeCor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(nomeAluno.toUpperCase(), img.naturalWidth / 2, img.naturalHeight * (nomeY / 100))
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `certificado-${nomeAluno.split(' ')[0].toLowerCase()}.png`
      link.click()
    } catch {
      // Fallback: baixa o template original
      const link = document.createElement('a')
      link.href = templateUrl
      link.download = `certificado-${nomeAluno.split(' ')[0].toLowerCase()}.png`
      link.target = '_blank'
      link.click()
    }
    setBaixando(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 32, maxWidth: 780, width: '100%', textAlign: 'center' }}>

        <div style={{ fontSize: 56, marginBottom: 8 }}>🎓</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Parabéns, {nomeAluno.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>
          Você concluiu 100% da formação! 🏆✨<br />
          <strong style={{ color: 'var(--avp-text)' }}>Baixe seu certificado abaixo.</strong>
        </p>

        {/* Preview: imagem normal + nome sobreposto em CSS */}
        <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)', position: 'relative', background: '#111' }}>
          {!imgCarregada && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>⏳ Carregando...</p>
            </div>
          )}
          <img
            ref={imgRef}
            src={templateUrl}
            alt="Certificado"
            crossOrigin="anonymous"
            onLoad={() => setImgCarregada(true)}
            style={{ width: '100%', display: 'block', opacity: imgCarregada ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          {/* Nome sobreposto via CSS */}
          {imgCarregada && (
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              top: `${nomeY}%`, width: '80%',
              textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700,
              fontSize: `${nomeFontePct * 100}cqw`, color: nomeCor,
              textTransform: 'uppercase', letterSpacing: 2, lineHeight: 1.2,
              containerType: undefined,
              pointerEvents: 'none',
            }}>
              {nomeAluno}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={baixar} disabled={baixando}
            style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: baixando ? 'not-allowed' : 'pointer', opacity: baixando ? 0.7 : 1 }}>
            {baixando ? '⏳ Gerando...' : '⬇️ Baixar Certificado'}
          </button>
          {onVerCarteira && (
            <button onClick={onVerCarteira}
              style={{ background: '#fbbf2420', border: '1px solid #fbbf2460', color: '#fbbf24', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              🪪 Ver Carteirinha
            </button>
          )}
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
