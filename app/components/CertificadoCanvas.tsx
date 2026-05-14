'use client'
import { useEffect, useRef, useState } from 'react'

type Props = {
  nomeAluno: string
  templateUrl: string
  // posição vertical 0-100 (% da altura), default 63
  nomeY?: number
  // fonte em px relativo à largura, default 0.05 (5% da largura)
  nomeFontePct?: number
  nomeCor?: string
  onDataUrl?: (url: string) => void
}

export default function CertificadoCanvas({
  nomeAluno, templateUrl, nomeY = 63, nomeFontePct = 0.048, nomeCor = '#1a1a1a', onDataUrl,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    // Usa proxy para evitar CORS
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(templateUrl)}`
    img.src = proxyUrl

    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)

      const fontSize = Math.round(img.naturalWidth * nomeFontePct)
      ctx.font = `700 ${fontSize}px Georgia, 'Times New Roman', serif`
      ctx.fillStyle = nomeCor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const x = img.naturalWidth / 2
      const y = img.naturalHeight * (nomeY / 100)
      ctx.fillText(nomeAluno.toUpperCase(), x, y)

      const dataUrl = canvas.toDataURL('image/png')
      onDataUrl?.(dataUrl)
      setPronto(true)
    }

    img.onerror = () => setErro(true)
  }, [templateUrl, nomeAluno, nomeY, nomeFontePct, nomeCor])

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)', position: 'relative', background: '#111' }}>
      {!pronto && !erro && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>⏳ Gerando certificado...</p>
        </div>
      )}
      {erro && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Não foi possível carregar o certificado.</p>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', opacity: pronto ? 1 : 0, transition: 'opacity 0.3s' }} />
    </div>
  )
}
