'use client'
import { useEffect, useRef } from 'react'

export default function CelebracaoModulo({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cores = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#a855f7', '#f97316', '#14b8a6']

    type Particula = {
      x: number; y: number; vx: number; vy: number
      cor: string; tamanho: number; rotacao: number; vrot: number
      forma: 'rect' | 'circle' | 'star'
    }

    const particulas: Particula[] = []
    for (let i = 0; i < 180; i++) {
      particulas.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 5,
        cor: cores[Math.floor(Math.random() * cores.length)],
        tamanho: 6 + Math.random() * 10,
        rotacao: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
        forma: ['rect', 'circle', 'star'][Math.floor(Math.random() * 3)] as 'rect' | 'circle' | 'star',
      })
    }

    let raf: number
    let frame = 0

    function desenharEstrela(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, pontas: number) {
      const angStep = Math.PI / pontas
      ctx.beginPath()
      for (let i = 0; i < pontas * 2; i++) {
        const raio = i % 2 === 0 ? r : r * 0.4
        const ang = i * angStep - Math.PI / 2
        if (i === 0) ctx.moveTo(cx + raio * Math.cos(ang), cy + raio * Math.sin(ang))
        else ctx.lineTo(cx + raio * Math.cos(ang), cy + raio * Math.sin(ang))
      }
      ctx.closePath()
    }

    function animar() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      for (const p of particulas) {
        p.x += p.vx + Math.sin(frame * 0.02 + p.y * 0.01) * 0.5
        p.y += p.vy
        p.vy += 0.05
        p.rotacao += p.vrot
        p.vx *= 0.99

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotacao)
        ctx.fillStyle = p.cor
        ctx.globalAlpha = Math.max(0, 1 - p.y / (canvas.height * 0.9))

        if (p.forma === 'rect') {
          ctx.fillRect(-p.tamanho / 2, -p.tamanho / 4, p.tamanho, p.tamanho / 2)
        } else if (p.forma === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.tamanho / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          desenharEstrela(ctx, 0, 0, p.tamanho / 2, 5)
          ctx.fill()
        }

        ctx.restore()

        // Reinicia partícula quando sai da tela
        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
          p.vy = 2 + Math.random() * 4
        }
      }

      raf = requestAnimationFrame(animar)
    }

    animar()

    const timer = setTimeout(onClose, 4500)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
        background: 'rgba(0,0,0,0.75)',
        cursor: 'pointer',
        animation: 'fadeInCel 0.4s ease',
      }}
    >
      <style>{`
        @keyframes fadeInCel { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: scale(1) } }
        @keyframes pulsar { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
        @keyframes fadeOutCel { from { opacity: 1 } to { opacity: 0 } }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 72, marginBottom: 8, animation: 'pulsar 1s ease-in-out infinite' }}>🏆</div>
        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 72px)',
          fontWeight: 900, color: '#fff',
          textShadow: '0 0 40px rgba(99,102,241,0.8), 0 4px 24px rgba(0,0,0,0.8)',
          letterSpacing: -1, margin: 0, lineHeight: 1.1,
        }}>
          Parabéns!
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 3vw, 24px)',
          color: '#a5b4fc', fontWeight: 700,
          margin: '12px 0 0', textShadow: '0 2px 12px rgba(0,0,0,0.8)',
        }}>
          Módulo concluído com sucesso! 🎉
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 24 }}>
          Toque para continuar
        </p>
      </div>
    </div>
  )
}
