'use client'
import { useRef, useState } from 'react'

type Props = {
  nomeAluno: string
  templateUrl: string
  nomeX: number
  nomeY: number
  nomeTamanho: number
  nomeCor: string
  onClose: () => void
}

function carregarImagem(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function CertificadoPopup({ nomeAluno, templateUrl, nomeX, nomeY, nomeTamanho, nomeCor, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gerado, setGerado] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')

  async function gerar() {
    setGerando(true); setErro('')
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    try {
      let template: HTMLImageElement
      try { template = await carregarImagem(templateUrl, 'anonymous') }
      catch { template = await carregarImagem(templateUrl) }

      canvas.width = template.width || 2480
      canvas.height = template.height || 1748

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height)

      const x = canvas.width * (nomeX / 100)
      const y = canvas.height * (nomeY / 100)
      const fontSize = nomeTamanho || 72

      ctx.font = `bold ${fontSize}px 'Inter', 'Arial', sans-serif`
      ctx.fillStyle = nomeCor || '#1a1a2e'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(nomeAluno, x, y)

      setGerado(true)
    } catch {
      setErro('Erro ao gerar certificado. Verifique se o template está configurado.')
    }
    setGerando(false)
  }

  function baixar() {
    const canvas = canvasRef.current!
    const link = document.createElement('a')
    link.download = `certificado-${nomeAluno.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 20, padding: 32, maxWidth: 700, width: '100%', textAlign: 'center' }}>

        {/* Celebração */}
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎓</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Parabéns, {nomeAluno.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--avp-text-dim)', fontSize: 16, marginBottom: 24, lineHeight: 1.6 }}>
          Você concluiu 100% da formação! 🏆✨<br />
          <strong style={{ color: 'var(--avp-text)' }}>O sucesso te espera!</strong>
        </p>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!gerado && !gerando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={gerar}
              style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
              🎓 Gerar meu Certificado
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', cursor: 'pointer', fontSize: 14 }}>
              Fechar
            </button>
          </div>
        )}

        {gerando && (
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>⏳ Gerando seu certificado...</p>
        )}

        {erro && (
          <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '12px 16px', color: 'var(--avp-danger)', fontSize: 14, marginBottom: 12 }}>
            {erro}
          </div>
        )}

        {gerado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <canvas ref={canvasRef}
              style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--avp-border)', display: 'block' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={baixar}
                style={{ background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                ⬇️ Baixar Certificado (PNG)
              </button>
              <button onClick={onClose}
                style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontSize: 14 }}>
                Fechar
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)' }}>
              💡 Alta resolução — ideal para imprimir em A4 paisagem e porta-retrato
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
