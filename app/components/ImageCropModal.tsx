'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  aspectRatio?: number   // largura/altura (1 = quadrado/círculo, 0.75 = 3x4 retrato)
  circular?: boolean
  title?: string
  onSave: (dataUrl: string, blob: Blob) => void
  onCancel: () => void
}

export default function ImageCropModal({
  src, aspectRatio = 1, circular = false,
  title = 'Ajustar foto', onSave, onCancel,
}: Props) {
  const CROP_W = 280
  const CROP_H = Math.round(CROP_W / aspectRatio)

  const [imgNW, setImgNW] = useState(0)
  const [imgNH, setImgNH] = useState(0)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, ox: 0, oy: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const dispW = imgNW * baseScale * zoom
  const dispH = imgNH * baseScale * zoom

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.target as HTMLImageElement
    const nw = img.naturalWidth, nh = img.naturalHeight
    const bs = Math.max(CROP_W / nw, CROP_H / nh)
    setImgNW(nw); setImgNH(nh); setBaseScale(bs)
    setOffset({ x: (CROP_W - nw * bs) / 2, y: (CROP_H - nh * bs) / 2 })
    setZoom(1)
  }

  function startDrag(clientX: number, clientY: number) {
    setDragging(true)
    dragRef.current = { startX: clientX, startY: clientY, ox: offset.x, oy: offset.y }
  }
  function moveDrag(clientX: number, clientY: number) {
    if (!dragging) return
    const dx = clientX - dragRef.current.startX
    const dy = clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy })
  }
  function endDrag() { setDragging(false) }

  function changeZoom(newZoom: number) {
    if (dispW === 0) return
    const newDispW = imgNW * baseScale * newZoom
    const newDispH = imgNH * baseScale * newZoom
    const ratioX = (CROP_W / 2 - offset.x) / dispW
    const ratioY = (CROP_H / 2 - offset.y) / dispH
    setOffset({ x: CROP_W / 2 - ratioX * newDispW, y: CROP_H / 2 - ratioY * newDispH })
    setZoom(newZoom)
  }

  async function save() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = CROP_W
    canvas.height = CROP_H

    if (circular) {
      ctx.beginPath()
      ctx.arc(CROP_W / 2, CROP_H / 2, CROP_W / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    const srcX = (-offset.x / dispW) * imgNW
    const srcY = (-offset.y / dispH) * imgNH
    const srcW = (CROP_W / dispW) * imgNW
    const srcH = (CROP_H / dispH) * imgNH

    ctx.drawImage(imgRef.current!, srcX, srcY, srcW, srcH, 0, 0, CROP_W, CROP_H)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    // Gera blob com fallback garantido
    const blob = await new Promise<Blob>(resolve => {
      canvas.toBlob(b => {
        if (b) { resolve(b); return }
        // fallback: converte dataUrl → Blob manualmente
        const arr = dataUrl.split(',')
        const bstr = atob(arr[1])
        const u8 = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
        resolve(new Blob([u8], { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    })

    onSave(dataUrl, blob) // parent chama setShowCrop(false) aqui
  }

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 4000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: CROP_W }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</p>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      {/* Crop preview */}
      <div
        style={{ width: CROP_W, height: CROP_H, overflow: 'hidden', borderRadius: circular ? '50%' : 8, border: '2px solid #02A153', position: 'relative', background: '#111', cursor: dragging ? 'grabbing' : 'grab', flexShrink: 0 }}
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY) }}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY) }}
        onTouchEnd={endDrag}
      >
        <img
          ref={imgRef}
          src={src}
          onLoad={handleLoad}
          draggable={false}
          style={{ position: 'absolute', left: offset.x, top: offset.y, width: dispW || 'auto', height: dispH || 'auto', maxWidth: 'none', pointerEvents: 'none', userSelect: 'none' }}
        />
        {/* Grid overlay */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} width={CROP_W} height={CROP_H}>
          <line x1={CROP_W / 3} y1="0" x2={CROP_W / 3} y2={CROP_H} stroke="#fff" strokeWidth="0.8" />
          <line x1={(CROP_W / 3) * 2} y1="0" x2={(CROP_W / 3) * 2} y2={CROP_H} stroke="#fff" strokeWidth="0.8" />
          <line x1="0" y1={CROP_H / 3} x2={CROP_W} y2={CROP_H / 3} stroke="#fff" strokeWidth="0.8" />
          <line x1="0" y1={(CROP_H / 3) * 2} x2={CROP_W} y2={(CROP_H / 3) * 2} stroke="#fff" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: CROP_W }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>🔍</span>
        <input
          type="range" min="1" max="4" step="0.05" value={zoom}
          onChange={e => changeZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#02A153', cursor: 'pointer' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, minWidth: 36 }}>{Math.round(zoom * 100)}%</span>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, textAlign: 'center' }}>
        Arraste para reposicionar · Use o slider para dar zoom
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={save}
          style={{ background: '#02A153', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 32px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
          ✓ Confirmar
        </button>
        <button onClick={onCancel}
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '11px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Cancelar
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
