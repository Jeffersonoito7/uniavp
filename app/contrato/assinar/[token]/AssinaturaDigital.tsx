'use client'
import { useRef, useState, useEffect } from 'react'

type Props = {
  token: string
  nomeAssinante: string
  tituloContrato: string
  numeroRegistro: string
  corpoHtml: string
  jaAssinou: boolean
}

export default function AssinaturaDigital({ token, nomeAssinante, tituloContrato, numeroRegistro, corpoHtml, jaAssinou }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(jaAssinou)
  const [erro, setErro] = useState('')
  const [leu, setLeu] = useState(false)
  const [etapa, setEtapa] = useState<'ler' | 'assinar'>(jaAssinou ? 'assinar' : 'ler')
  const ultimoPonto = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [etapa])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function iniciar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setDesenhando(true)
    ultimoPonto.current = getPos(e, canvas)
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!desenhando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(ultimoPonto.current!.x, ultimoPonto.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ultimoPonto.current = pos
    setTemAssinatura(true)
  }

  function parar(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    setDesenhando(false)
    ultimoPonto.current = null
  }

  function limpar() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  async function assinar() {
    const canvas = canvasRef.current
    if (!canvas || !temAssinatura) return
    setEnviando(true)
    setErro('')
    const assinatura_url = canvas.toDataURL('image/png')
    const res = await fetch(`/api/contrato/assinar/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assinatura_url }),
    })
    const data = await res.json()
    if (data.ok) {
      setConcluido(true)
    } else {
      setErro(data.error ?? 'Erro ao registrar assinatura.')
    }
    setEnviando(false)
  }

  if (concluido) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>Assinatura registrada!</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 16 }}>Sua assinatura digital foi registrada com validade juridica para o contrato:</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>{tituloContrato}</p>
          <p style={{ color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>N. {numeroRegistro}</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 20 }}>Voce receberá uma copia do documento assinado por WhatsApp quando todos os assinantes concluirem.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 2px' }}>Assinatura Digital</p>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{tituloContrato}</p>
        </div>
        <span style={{ background: '#334155', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontFamily: 'monospace' }}>N. {numeroRegistro}</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Etapa 1: Ler o contrato */}
        {etapa === 'ler' && (
          <>
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14 }}>
              <strong>Ola, {nomeAssinante}!</strong> Leia o contrato abaixo com atencao antes de assinar.
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '32px 36px', marginBottom: 24, fontSize: 14, lineHeight: 1.8, color: '#1e293b' }}
              dangerouslySetInnerHTML={{ __html: corpoHtml }} />

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={leu} onChange={e => setLeu(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: '#374151' }}>
                  Li e compreendi o conteudo deste contrato e concordo com os termos apresentados.
                </span>
              </label>
            </div>

            <button
              onClick={() => leu && setEtapa('assinar')}
              disabled={!leu}
              style={{ width: '100%', background: leu ? '#16a34a' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 16, cursor: leu ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
              Continuar para assinatura →
            </button>
          </>
        )}

        {/* Etapa 2: Assinar */}
        {etapa === 'assinar' && (
          <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Sua assinatura digital</p>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Desenhe sua assinatura no campo abaixo usando o dedo ou o mouse.</p>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair', background: '#fff', touchAction: 'none' }}>
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={200}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  onMouseDown={iniciar}
                  onMouseMove={desenhar}
                  onMouseUp={parar}
                  onMouseLeave={parar}
                  onTouchStart={iniciar}
                  onTouchMove={desenhar}
                  onTouchEnd={parar}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  Assinado em: {new Date().toLocaleDateString('pt-BR')} — {nomeAssinante}
                </p>
                <button onClick={limpar} style={{ background: 'none', border: '1px solid #e2e8f0', color: '#6b7280', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13 }}>
                  Limpar
                </button>
              </div>
            </div>

            <div style={{ background: '#f1f5f9', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#475569' }}>
              Esta assinatura tem validade juridica conforme a Lei 14.063/2020 e o Marco Civil da Internet (Lei 12.965/2014).
              Seu IP, data, hora e hash do documento serao registrados.
            </div>

            {erro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEtapa('ler')} style={{ background: 'none', border: '1px solid #e2e8f0', color: '#6b7280', borderRadius: 10, padding: '13px 20px', cursor: 'pointer', fontSize: 14 }}>
                ← Reler
              </button>
              <button
                onClick={assinar}
                disabled={!temAssinatura || enviando}
                style={{ flex: 1, background: temAssinatura && !enviando ? '#16a34a' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: temAssinatura && !enviando ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                {enviando ? 'Registrando assinatura...' : 'Assinar Digitalmente'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
