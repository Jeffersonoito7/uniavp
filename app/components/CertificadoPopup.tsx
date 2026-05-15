'use client'
import { useState } from 'react'

type Props = {
  nomeAluno: string
  templateUrl: string
  nomeY?: number          // % da altura, padrão 40
  nomeFontePct?: number   // % da largura, padrão 0.04
  nomeCor?: string        // padrão #1a1a1a
  logoEsquerdaUrl?: string | null
  logoDireitaUrl?: string | null
  logoY?: number          // posição vertical logos %, padrão 88
  logoTamPct?: number     // tamanho logos % da altura, padrão 0.10
  assinaturaUrl?: string | null
  assinaturaNome?: string
  assinaturaCargo?: string
  assinaturaY?: number    // % da altura da linha de assinatura, padrão 82
  onClose: () => void
  onVerCarteira?: () => void
}

async function carregarImg(url: string): Promise<HTMLImageElement> {
  const src = url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url
  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
    setTimeout(rej, 12000)
  })
}

export default function CertificadoPopup({
  nomeAluno, templateUrl,
  nomeY = 40, nomeFontePct = 0.04, nomeCor = '#1a1a1a',
  logoEsquerdaUrl, logoDireitaUrl, logoY = 88, logoTamPct = 0.10,
  assinaturaUrl, assinaturaNome, assinaturaCargo, assinaturaY = 82,
  onClose, onVerCarteira,
}: Props) {
  const [baixando, setBaixando] = useState(false)
  const [imgCarregada, setImgCarregada] = useState(false)

  async function baixar() {
    setBaixando(true)
    try {
      const base = await carregarImg(templateUrl)
      const W = base.naturalWidth, H = base.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')!

      // 1. Template
      ctx.drawImage(base, 0, 0)

      // 2. Nome
      const fs = Math.round(W * nomeFontePct)
      ctx.font = `700 ${fs}px Georgia, serif`
      ctx.fillStyle = nomeCor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(nomeAluno.toUpperCase(), W / 2, H * (nomeY / 100))

      // 3. Logo esquerda
      if (logoEsquerdaUrl) {
        try {
          const logo = await carregarImg(logoEsquerdaUrl)
          const maxH = Math.round(H * logoTamPct)
          const lw = Math.round(logo.naturalWidth * (maxH / logo.naturalHeight))
          const margin = Math.round(W * 0.05)
          ctx.drawImage(logo, margin, H * (logoY / 100) - maxH / 2, lw, maxH)
        } catch { /* ignora */ }
      }

      // 4. Logo direita
      if (logoDireitaUrl) {
        try {
          const logo = await carregarImg(logoDireitaUrl)
          const maxH = Math.round(H * logoTamPct)
          const lw = Math.round(logo.naturalWidth * (maxH / logo.naturalHeight))
          const margin = Math.round(W * 0.05)
          ctx.drawImage(logo, W - margin - lw, H * (logoY / 100) - maxH / 2, lw, maxH)
        } catch { /* ignora */ }
      }

      // 5. Assinatura
      const lineY = H * (assinaturaY / 100)
      const lineX = Math.round(W * 0.10)
      const lineW = Math.round(W * 0.22)

      if (assinaturaUrl) {
        try {
          const assin = await carregarImg(assinaturaUrl)
          const maxH = Math.round(H * 0.08)
          const maxW = lineW
          const ratio = Math.min(maxW / assin.naturalWidth, maxH / assin.naturalHeight)
          const aw = Math.round(assin.naturalWidth * ratio)
          const ah = Math.round(assin.naturalHeight * ratio)
          ctx.drawImage(assin, lineX, lineY - ah - Math.round(H * 0.005), aw, ah)
        } catch { /* ignora */ }
      }

      if (assinaturaNome || assinaturaCargo) {
        // Linha
        ctx.beginPath()
        ctx.strokeStyle = '#444'
        ctx.lineWidth = Math.max(1, Math.round(H * 0.001))
        ctx.moveTo(lineX, lineY)
        ctx.lineTo(lineX + lineW, lineY)
        ctx.stroke()

        const gap = Math.round(H * 0.006)
        if (assinaturaNome) {
          const fnSize = Math.round(W * 0.013)
          ctx.font = `700 ${fnSize}px Arial, sans-serif`
          ctx.fillStyle = '#1a1a1a'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.fillText(assinaturaNome, lineX, lineY + gap)
        }
        if (assinaturaCargo) {
          const fcSize = Math.round(W * 0.010)
          ctx.font = `${fcSize}px Arial, sans-serif`
          ctx.fillStyle = '#555'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          const nomeH = assinaturaNome ? Math.round(W * 0.013) + gap : gap
          ctx.fillText(assinaturaCargo, lineX, lineY + nomeH + gap)
        }
      }

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `certificado-${nomeAluno.split(' ')[0].toLowerCase()}.png`
      link.click()
    } catch {
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

        {/* Preview */}
        <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)', position: 'relative', background: '#f8f8f8', containerType: 'inline-size' }}>
          {!imgCarregada && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: '#111' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>⏳ Carregando...</p>
            </div>
          )}
          <img
            src={templateUrl}
            alt="Certificado"
            crossOrigin="anonymous"
            onLoad={() => setImgCarregada(true)}
            style={{ width: '100%', display: 'block', opacity: imgCarregada ? 1 : 0, transition: 'opacity 0.3s' }}
          />

          {imgCarregada && (<>
            {/* Nome */}
            <div style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              top: `${nomeY}%`, width: '70%', textAlign: 'center',
              fontFamily: 'Georgia, serif', fontWeight: 700,
              fontSize: `${nomeFontePct * 100}cqw`, color: nomeCor,
              textTransform: 'uppercase', letterSpacing: 2, lineHeight: 1.2,
              pointerEvents: 'none',
            }}>
              {nomeAluno}
            </div>

            {/* Logo esquerda */}
            {logoEsquerdaUrl && (
              <img src={logoEsquerdaUrl} alt="logo esq"
                style={{ position: 'absolute', left: '5%', top: `${logoY}%`, transform: 'translateY(-50%)', height: `${logoTamPct * 100}%`, objectFit: 'contain', pointerEvents: 'none' }} />
            )}

            {/* Logo direita */}
            {logoDireitaUrl && (
              <img src={logoDireitaUrl} alt="logo dir"
                style={{ position: 'absolute', right: '5%', top: `${logoY}%`, transform: 'translateY(-50%)', height: `${logoTamPct * 100}%`, objectFit: 'contain', pointerEvents: 'none' }} />
            )}

            {/* Assinatura */}
            {(assinaturaUrl || assinaturaNome) && (
              <div style={{ position: 'absolute', left: '10%', top: `${assinaturaY}%`, transform: 'translateY(-100%)', pointerEvents: 'none', textAlign: 'left' }}>
                {assinaturaUrl && (
                  <img src={assinaturaUrl} alt="assinatura"
                    style={{ height: '6cqw', maxWidth: '22cqw', objectFit: 'contain', display: 'block', marginBottom: '0.3cqw' }} />
                )}
                <div style={{ width: '22cqw', height: '0.1cqw', minHeight: 1, background: '#444', marginBottom: '0.3cqw' }} />
                {assinaturaNome && (
                  <p style={{ margin: 0, fontSize: '1.2cqw', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>
                    {assinaturaNome}
                  </p>
                )}
                {assinaturaCargo && (
                  <p style={{ margin: 0, fontSize: '1cqw', color: '#555', lineHeight: 1.3 }}>
                    {assinaturaCargo}
                  </p>
                )}
              </div>
            )}
          </>)}
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
