'use client'
import { useRef, useState } from 'react'
import ImageCropModal from '@/app/components/ImageCropModal'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean; formato: string; ativo?: boolean;
  texto_ativo?: boolean; texto_template?: string;
  texto_x?: number; texto_y?: number; texto_tamanho?: number;
  texto_cor?: string; texto_negrito?: boolean; texto_alinhamento?: string; texto_sombra?: boolean;
}

type Formato = 'feed' | 'stories'

const DIMS: Record<Formato, { w: number; h: number; label: string; ratio: string }> = {
  feed:    { w: 1080, h: 1080, label: 'Feed',    ratio: '1 / 1' },
  stories: { w: 1080, h: 1920, label: 'Stories', ratio: '9 / 16' },
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

export default function ArtesCliente({ templates, nomeAluno, fotoInicial }: { templates: Template[]; nomeAluno: string; fotoInicial?: string | null }) {
  const [formato, setFormato] = useState<Formato>('feed')
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
  const [fotoLocal, setFotoLocal] = useState<string | null>(fotoInicial ?? null)
  const [cropZoom, setCropZoom] = useState(1)
  const [panBgX, setPanBgX] = useState(50) // 0–100, 50 = centralizado
  const [panBgY, setPanBgY] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<{ x: number; y: number; bgX: number; bgY: number } | null>(null)

  // Mostra todos os templates ativos — formato é escolhido na hora de gerar
  const templatesFiltrados = templates.filter(t => t.ativo !== false)

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  function handleCropSalvo(dataUrl: string) {
    setCropSrc(null)
    setFotoLocal(dataUrl)
    setCropZoom(1)
    setPanBgX(50)
    setPanBgY(50)
    setPronto(false)
    setErro('')
  }

  function startDrag(e: React.PointerEvent) {
    if (!fotoLocal) return
    setIsDragging(true)
    dragOrigin.current = { x: e.clientX, y: e.clientY, bgX: panBgX, bgY: panBgY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveDrag(e: React.PointerEvent) {
    if (!dragOrigin.current || !previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const t = templateSelecionado
    const fW = t?.foto_largura ?? 0
    const fH = t?.foto_altura ?? 0
    const usaArea = t && fW > 0 && fH > 0 && (fW < 90 || fH < 90)
    // quando usa área específica, sensibilidade relativa à área; caso contrário, ao canvas inteiro
    const refW = usaArea ? rect.width * (fW / 100) : rect.width
    const refH = usaArea ? rect.height * (fH / 100) : rect.height
    const dx = (e.clientX - dragOrigin.current.x) / refW * 100
    const dy = (e.clientY - dragOrigin.current.y) / refH * 100
    const sensitivity = 1 / cropZoom
    setPanBgX(Math.max(0, Math.min(100, dragOrigin.current.bgX - dx * sensitivity)))
    setPanBgY(Math.max(0, Math.min(100, dragOrigin.current.bgY - dy * sensitivity)))
    setPronto(false)
  }

  function endDrag() {
    setIsDragging(false)
    dragOrigin.current = null
  }

  function handleZoom(z: number) {
    setCropZoom(z)
    if (z <= 1) { setPanBgX(50); setPanBgY(50) }
    setPronto(false)
  }

  async function gerar() {
    if (!templateSelecionado || !fotoLocal || !formato) return
    if (!templateSelecionado.arte_url) {
      setErro('Este template ainda não tem arte configurada.')
      return
    }

    setGerando(true); setErro(''); setPronto(false)
    const { w, h } = DIMS[formato]
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)

    try {
      // Se a foto for URL remota (não blob/data), usa proxy para evitar canvas tainted
      const fotoSrc = fotoLocal.startsWith('http')
        ? `/api/proxy-image?url=${encodeURIComponent(fotoLocal)}`
        : fotoLocal
      const foto = await carregarImagem(fotoSrc, 'anonymous')

      // Replica exatamente o comportamento CSS: background-size + background-position
      const scale = Math.max(w / foto.width, h / foto.height) * cropZoom
      const dw = foto.width * scale
      const dh = foto.height * scale
      const imgX = dw > w ? -(dw - w) * panBgX / 100 : (w - dw) / 2
      const imgY = dh > h ? -(dh - h) * panBgY / 100 : (h - dh) / 2

      // Clipa se o template usar área específica (foto_redondo ou rect)
      const fotoX = Math.round(w * templateSelecionado.foto_x / 100)
      const fotoY = Math.round(h * templateSelecionado.foto_y / 100)
      const fotoW = Math.round(w * templateSelecionado.foto_largura / 100)
      const fotoH = Math.round(h * templateSelecionado.foto_altura / 100)
      const usaAreaEspecifica = fotoW > 0 && fotoH > 0 && (fotoW < w * 0.9 || fotoH < h * 0.9)

      if (usaAreaEspecifica) {
        ctx.save()
        if (templateSelecionado.foto_redondo) {
          ctx.beginPath()
          ctx.arc(fotoX + fotoW / 2, fotoY + fotoH / 2, Math.min(fotoW, fotoH) / 2, 0, Math.PI * 2)
        } else {
          ctx.beginPath()
          ctx.rect(fotoX, fotoY, fotoW, fotoH)
        }
        ctx.clip()
        // Reescala a foto para caber na área específica
        const areaScale = Math.max(fotoW / foto.width, fotoH / foto.height) * cropZoom
        const adw = foto.width * areaScale
        const adh = foto.height * areaScale
        const ax = fotoX + (fotoW - adw) * (panBgX / 100)
        const ay = fotoY + (fotoH - adh) * (panBgY / 100)
        ctx.drawImage(foto, ax, ay, adw, adh)
        ctx.restore()
      } else {
        // Foto preenche o canvas inteiro — template cria a moldura
        ctx.drawImage(foto, imgX, imgY, dw, dh)
      }

      // Template por cima — usa proxy para evitar CORS
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(templateSelecionado.arte_url)}`
      try {
        const art = await carregarImagem(proxyUrl, 'anonymous')
        ctx.drawImage(art, 0, 0, w, h)
      } catch {
        // fallback direto
        try {
          const art = await carregarImagem(templateSelecionado.arte_url, 'anonymous')
          ctx.drawImage(art, 0, 0, w, h)
        } catch {
          setErro('Não foi possível carregar a arte. Verifique se a URL é pública.')
          setGerando(false)
          return
        }
      }

      // Texto de sobreposição com o nome do consultor
      if (templateSelecionado.texto_ativo && templateSelecionado.texto_template) {
        const texto = templateSelecionado.texto_template.replace('{nome}', nomeAluno)
        const tam = Math.round(h * (templateSelecionado.texto_tamanho ?? 5) / 100)
        const peso = templateSelecionado.texto_negrito !== false ? 'bold' : 'normal'
        ctx.font = `${peso} ${tam}px Inter, Arial, sans-serif`
        ctx.fillStyle = templateSelecionado.texto_cor ?? '#FFFFFF'
        ctx.textAlign = (templateSelecionado.texto_alinhamento ?? 'center') as CanvasTextAlign
        const tx = Math.round(w * (templateSelecionado.texto_x ?? 50) / 100)
        const ty = Math.round(h * (templateSelecionado.texto_y ?? 85) / 100)
        if (templateSelecionado.texto_sombra !== false) {
          ctx.shadowColor = 'rgba(0,0,0,0.7)'
          ctx.shadowBlur = Math.round(tam * 0.3)
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
        }
        ctx.fillText(texto, tx, ty)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }

      setPronto(true)
    } catch {
      setErro('Erro ao gerar a arte. Verifique sua foto.')
    }
    setGerando(false)
  }

  function baixar() {
    const canvas = canvasRef.current!
    try {
      const link = document.createElement('a')
      link.download = `arte-avp-${formato}-${templateSelecionado?.tipo || ''}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      setErro('Salve a imagem manualmente clicando com botão direito no preview.')
    }
  }

  return (
    <>
    {cropSrc && (
      <ImageCropModal
        src={cropSrc}
        aspectRatio={1}
        title="Ajustar foto para a arte"
        onSave={handleCropSalvo}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Minhas Artes</h1>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 28 }}>
        Gere artes profissionais com sua foto para compartilhar nas redes sociais.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ─── COLUNA ESQUERDA ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Template */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 18 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>1. Escolha a arte</p>
              {templatesFiltrados.length === 0 ? (
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Nenhum template configurado ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {templatesFiltrados.map(t => (
                    <button key={t.id} onClick={() => { setTemplateSelecionado(t); setPronto(false) }}
                      style={{ background: templateSelecionado?.id === t.id ? 'var(--grad-brand)' : 'var(--avp-black)', border: `1px solid ${templateSelecionado?.id === t.id ? 'transparent' : 'var(--avp-border)'}`, borderRadius: 8, padding: '10px 13px', color: '#fff', cursor: 'pointer', textAlign: 'left' as const, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{t.tipo.includes('boas_vindas') ? '🎉' : t.tipo.includes('gestor') ? '🏆' : '⭐'}</span>
                      {t.titulo.replace(' (Stories)', '').replace(' (Feed)', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload foto */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 18 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>3. Sua foto</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 12, marginBottom: 12 }}>Foto de rosto com boa iluminação e fundo neutro.</p>
              <input ref={inputFotoRef} type="file" accept="image/*" onChange={selecionarFoto} style={{ display: 'none' }} />
              <button onClick={() => inputFotoRef.current?.click()}
                style={{ width: '100%', background: fotoLocal ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {fotoLocal ? '🔄 Trocar foto' : '📷 Selecionar foto'}
              </button>
            </div>

            {/* Zoom slider */}
            {fotoLocal && (
              <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>🔍 Zoom do corte</p>
                  <span style={{ fontSize: 13, color: 'var(--avp-text-dim)' }}>{Math.round(cropZoom * 100)}%</span>
                </div>
                <input type="range" min="1" max="3" step="0.05" value={cropZoom}
                  onChange={e => handleZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--avp-green)', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>Original</span>
                  <span style={{ fontSize: 11, color: 'var(--avp-text-dim)' }}>3× zoom</span>
                </div>
              </div>
            )}

            {/* Formato de saída */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>3. Formato de saída</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['feed', 'stories'] as Formato[]).map(f => (
                  <button key={f} onClick={() => { setFormato(f); setPronto(false) }}
                    style={{ flex: 1, background: formato === f ? 'var(--grad-brand)' : 'var(--avp-black)', border: `1px solid ${formato === f ? 'transparent' : 'var(--avp-border)'}`, borderRadius: 8, padding: '10px 8px', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>{f === 'feed' ? '🖼️' : '📱'}</span>
                    <span>{f === 'feed' ? 'Feed' : 'Stories'}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{f === 'feed' ? '1080×1080' : '1080×1920'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist do que falta */}
            {(!templateSelecionado || !fotoLocal) && (
              <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--avp-text-dim)', margin: '0 0 4px' }}>Para gerar, complete:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ fontSize: 16 }}>{templateSelecionado ? '✅' : '⬜'}</span>
                  <span style={{ color: templateSelecionado ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                    {templateSelecionado ? `Arte: ${templateSelecionado.titulo}` : 'Escolha uma arte (passo 1)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ fontSize: 16 }}>{fotoLocal ? '✅' : '⬜'}</span>
                  <span style={{ color: fotoLocal ? 'var(--avp-green)' : 'var(--avp-text-dim)' }}>
                    {fotoLocal ? 'Foto carregada' : 'Envie uma foto (passo 2)'}
                  </span>
                </div>
              </div>
            )}

            {/* Gerar */}
            <button onClick={gerar} disabled={gerando || !templateSelecionado || !fotoLocal}
              style={{ background: templateSelecionado && fotoLocal ? 'var(--grad-brand)' : 'var(--avp-border)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 16, cursor: (gerando || !templateSelecionado || !fotoLocal) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {gerando ? '⏳ Gerando...' : templateSelecionado && fotoLocal ? `✨ Gerar em ${DIMS[formato].label}` : '✨ Gerar Arte'}
            </button>

            {erro && (
              <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '12px 16px', color: 'var(--avp-danger)', fontSize: 13 }}>
                {erro}
              </div>
            )}
          </div>

          {/* ─── COLUNA DIREITA — PREVIEW INTERATIVO ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
                {pronto ? '✅ Arte gerada — pronta para baixar' : '👁 Preview ao vivo'}
              </p>
              {fotoLocal && !pronto && (
                <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', background: 'var(--avp-black)', border: '1px solid var(--avp-border)', padding: '3px 10px', borderRadius: 6 }}>
                  ↔ Arraste para reposicionar
                </span>
              )}
            </div>

            {/* Preview CSS ao vivo (foto + template overlay) */}
            {!pronto && (
              <div
                ref={previewRef}
                style={{
                  position: 'relative', width: '100%', aspectRatio: DIMS[formato].ratio,
                  background: '#111', borderRadius: 12, overflow: 'hidden',
                  border: `2px solid ${fotoLocal && templateSelecionado ? 'var(--avp-green)' : 'var(--avp-border)'}`,
                  cursor: isDragging ? 'grabbing' : (fotoLocal ? 'grab' : 'default'),
                  userSelect: 'none',
                }}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
              >
                {/* FOTO — área específica ou canvas inteiro, igual ao canvas */}
                {fotoLocal && (() => {
                  const t = templateSelecionado
                  const fW = t?.foto_largura ?? 0
                  const fH = t?.foto_altura ?? 0
                  const usaArea = t && fW > 0 && fH > 0 && (fW < 90 || fH < 90)
                  if (usaArea) {
                    return (
                      <div style={{
                        position: 'absolute',
                        left: `${t!.foto_x}%`,
                        top: `${t!.foto_y}%`,
                        width: `${fW}%`,
                        height: `${fH}%`,
                        backgroundImage: `url(${fotoLocal})`,
                        backgroundSize: `${cropZoom * 100}%`,
                        backgroundPosition: `${panBgX}% ${panBgY}%`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: '#333',
                        borderRadius: t!.foto_redondo ? '50%' : 0,
                        overflow: 'hidden',
                      }} />
                    )
                  }
                  return (
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${fotoLocal})`,
                      backgroundSize: `${cropZoom * 100}%`,
                      backgroundPosition: `${panBgX}% ${panBgY}%`,
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#222',
                    }} />
                  )
                })()}

                {/* TEMPLATE PNG — sobrepõe a foto, partes transparentes revelam a foto */}
                {templateSelecionado?.arte_url && (
                  <img src={templateSelecionado.arte_url} alt="Template" draggable={false}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
                )}

                {/* TEXTO OVERLAY — preview ao vivo */}
                {templateSelecionado?.texto_ativo && templateSelecionado.texto_template && (
                  <div style={{
                    position: 'absolute',
                    left: `${templateSelecionado.texto_x ?? 50}%`,
                    top: `${templateSelecionado.texto_y ?? 85}%`,
                    transform: templateSelecionado.texto_alinhamento === 'left'
                      ? 'translate(0, -50%)'
                      : templateSelecionado.texto_alinhamento === 'right'
                        ? 'translate(-100%, -50%)'
                        : 'translate(-50%, -50%)',
                    fontSize: `${templateSelecionado.texto_tamanho ?? 5}cqw`,
                    fontWeight: templateSelecionado.texto_negrito !== false ? 800 : 400,
                    color: templateSelecionado.texto_cor ?? '#FFFFFF',
                    textAlign: (templateSelecionado.texto_alinhamento ?? 'center') as React.CSSProperties['textAlign'],
                    textShadow: templateSelecionado.texto_sombra !== false ? '1px 1px 4px rgba(0,0,0,0.8)' : 'none',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    containerType: 'inline-size',
                  }}>
                    {templateSelecionado.texto_template.replace('{nome}', nomeAluno)}
                  </div>
                )}

                {/* Estado vazio */}
                {(!fotoLocal || !templateSelecionado) && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14, gap: 10, textAlign: 'center' as const, padding: 20 }}>
                    <span style={{ fontSize: 44 }}>{!fotoLocal ? '📷' : '🎨'}</span>
                    <span>{!fotoLocal ? 'Envie sua foto para ver o preview' : 'Selecione uma arte para ver o preview'}</span>
                  </div>
                )}

                {/* Hint arraste */}
                {fotoLocal && cropZoom > 1 && (
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' as const, pointerEvents: 'none' }}>
                    {isDragging ? '↔ Reposicionando...' : '↔ Arraste para ajustar o corte'}
                  </div>
                )}
              </div>
            )}

            {/* Canvas único — sempre no DOM, visibilidade via CSS */}
            <div style={{ width: '100%', aspectRatio: DIMS[formato].ratio, borderRadius: 12, overflow: 'hidden', border: pronto ? '2px solid var(--avp-green)' : 'none', visibility: pronto ? 'visible' : 'hidden', height: pronto ? undefined : 0, margin: pronto ? undefined : 0 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>

            {/* Botão baixar */}
            {pronto && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={baixar}
                  style={{ flex: 1, background: 'var(--avp-green)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  ⬇️ Baixar Arte em PNG (1080px)
                </button>
                <button onClick={() => setPronto(false)}
                  style={{ background: 'none', border: '1px solid var(--avp-border)', color: 'var(--avp-text-dim)', borderRadius: 10, padding: '14px 18px', cursor: 'pointer', fontSize: 13 }}>
                  ✏️ Editar
                </button>
              </div>
            )}

            {fotoLocal && templateSelecionado && !pronto && (
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', textAlign: 'center' as const }}>
                💡 O preview mostra como ficará. Clique em <strong>"Gerar Arte"</strong> para exportar em alta qualidade (1080px).
              </p>
            )}
          </div>
        </div>
    </div>
    </>
  )
}
