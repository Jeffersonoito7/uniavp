'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  aspectRatio?: number   // largura/altura  (1 = quadrado, 0.75 = 3x4 retrato)
  circular?: boolean
  title?: string
  onSave: (dataUrl: string, blob: Blob) => void
  onCancel: () => void
}

export default function ImageCropModal({
  src, aspectRatio = 1, circular = false,
  title = 'Ajustar foto', onSave, onCancel,
}: Props) {
  // Área de preview
  const CROP_W = 280
  const CROP_H = Math.round(CROP_W / aspectRatio)

  // Saída em 3× para qualidade de impressão
  const OUT_SCALE = 3
  const OUT_W = CROP_W * OUT_SCALE
  const OUT_H = CROP_H * OUT_SCALE

  const [imgNW, setImgNW] = useState(0)
  const [imgNH, setImgNH] = useState(0)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
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
    setZoom(1); setRotation(0); setFlipH(false)
  }

  function startDrag(clientX: number, clientY: number) {
    setDragging(true)
    dragRef.current = { startX: clientX, startY: clientY, ox: offset.x, oy: offset.y }
  }
  function moveDrag(clientX: number, clientY: number) {
    if (!dragging) return
    setOffset({ x: dragRef.current.ox + clientX - dragRef.current.startX, y: dragRef.current.oy + clientY - dragRef.current.startY })
  }
  function endDrag() { setDragging(false) }

  function changeZoom(newZoom: number) {
    if (dispW === 0) return
    const nW = imgNW * baseScale * newZoom
    const nH = imgNH * baseScale * newZoom
    const rx = (CROP_W / 2 - offset.x) / dispW
    const ry = (CROP_H / 2 - offset.y) / dispH
    setOffset({ x: CROP_W / 2 - rx * nW, y: CROP_H / 2 - ry * nH })
    setZoom(newZoom)
  }

  function rotateQuick(deg: number) {
    setRotation(r => (r + deg + 360) % 360)
  }

  async function save() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = OUT_W
    canvas.height = OUT_H

    ctx.save()

    // Clip to canvas bounds
    ctx.rect(0, 0, OUT_W, OUT_H)
    ctx.clip()

    if (circular) {
      ctx.beginPath()
      ctx.arc(OUT_W / 2, OUT_H / 2, OUT_W / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    // Reproduz o mesmo transform do preview, escalado por OUT_SCALE
    const outDispW = dispW * OUT_SCALE
    const outDispH = dispH * OUT_SCALE
    const imgCenterX = (offset.x + dispW / 2) * OUT_SCALE
    const imgCenterY = (offset.y + dispH / 2) * OUT_SCALE

    ctx.translate(imgCenterX, imgCenterY)
    ctx.rotate((rotation * Math.PI) / 180)
    if (flipH) ctx.scale(-1, 1)
    ctx.drawImage(imgRef.current!, -outDispW / 2, -outDispH / 2, outDispW, outDispH)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/jpeg', 0.93)
    const blob = await new Promise<Blob>(resolve => {
      canvas.toBlob(b => {
        if (b) { resolve(b); return }
        const arr = dataUrl.split(',')
        const bstr = atob(arr[1])
        const u8 = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
        resolve(new Blob([u8], { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.93)
    })
    onSave(dataUrl, blob)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const btn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 4000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20, overflowY: 'auto' }}
      onMouseMove={e => moveDrag(e.clientX, e.clientY)}
      onMouseUp={endDrag}
    >
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: CROP_W }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</p>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      {/* Área de crop */}
      <div
        style={{ width: CROP_W, height: CROP_H, overflow: 'hidden', borderRadius: circular ? '50%' : 6, border: '2px solid #02A153', position: 'relative', background: '#111', cursor: dragging ? 'grabbing' : 'grab', flexShrink: 0, touchAction: 'none' }}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY) }}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY) }}
        onTouchEnd={endDrag}
      >
        <img
          ref={imgRef}
          src={src}
          onLoad={handleLoad}
          draggable={false}
          alt=""
          style={{
            position: 'absolute',
            left: offset.x + dispW / 2,
            top: offset.y + dispH / 2,
            width: dispW || 'auto',
            height: dispH || 'auto',
            maxWidth: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
            transformOrigin: '0 0',
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
          }}
        />
        {/* Grade de terços */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }} width={CROP_W} height={CROP_H}>
          <line x1={CROP_W / 3} y1="0" x2={CROP_W / 3} y2={CROP_H} stroke="#fff" strokeWidth="0.8" />
          <line x1={CROP_W * 2 / 3} y1="0" x2={CROP_W * 2 / 3} y2={CROP_H} stroke="#fff" strokeWidth="0.8" />
          <line x1="0" y1={CROP_H / 3} x2={CROP_W} y2={CROP_H / 3} stroke="#fff" strokeWidth="0.8" />
          <line x1="0" y1={CROP_H * 2 / 3} x2={CROP_W} y2={CROP_H * 2 / 3} stroke="#fff" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Dica */}
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, textAlign: 'center' }}>
        Arraste para reposicionar
      </p>

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: CROP_W }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, minWidth: 40 }}>Zoom</span>
        <input
          type="range" min="1" max="5" step="0.05" value={zoom}
          onChange={e => changeZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#02A153', cursor: 'pointer' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, minWidth: 38, textAlign: 'right' }}>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Rotação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: CROP_W }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, minWidth: 40 }}>Girar</span>
        <input
          type="range" min="-180" max="180" step="1" value={rotation}
          onChange={e => setRotation(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#6366f1', cursor: 'pointer' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, minWidth: 38, textAlign: 'right' }}>{rotation}°</span>
      </div>

      {/* Botões de rotação rápida + espelhar */}
      <div style={{ display: 'flex', gap: 8, width: CROP_W, justifyContent: 'center' }}>
        <button onClick={() => rotateQuick(-90)} style={btn} title="Girar 90° esquerda">↺ -90°</button>
        <button onClick={() => rotateQuick(90)} style={btn} title="Girar 90° direita">↻ +90°</button>
        <button onClick={() => setFlipH(f => !f)} style={{ ...btn, background: flipH ? '#6366f130' : 'rgba(255,255,255,0.1)', borderColor: flipH ? '#6366f1' : 'rgba(255,255,255,0.2)' }} title="Espelhar horizontalmente">
          ⇔ Espelhar
        </button>
        <button onClick={() => { setRotation(0); setZoom(1); setFlipH(false); setOffset({ x: (CROP_W - imgNW * baseScale) / 2, y: (CROP_H - imgNH * baseScale) / 2 }) }} style={btn} title="Resetar">↺ Reset</button>
      </div>

      {/* Confirmar / Cancelar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={save}
          style={{ background: '#02A153', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 36px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
          ✓ Confirmar
        </button>
        <button onClick={onCancel}
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Cancelar
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
