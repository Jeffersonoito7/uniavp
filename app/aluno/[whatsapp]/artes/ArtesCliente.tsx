'use client'
import { useRef, useState } from 'react'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean; formato: string;
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

export default function ArtesCliente({ templates, nomeAluno }: { templates: Template[]; nomeAluno: string }) {
  const [formato, setFormato] = useState<Formato | null>(null)
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
  const [fotoLocal, setFotoLocal] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const templatesFiltrados = templates.filter(t => t.formato === formato)

  function selecionarFormato(f: Formato) {
    setFormato(f)
    setTemplateSelecionado(null)
    setPronto(false)
    setErro('')
  }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoLocal(URL.createObjectURL(file))
    setPronto(false)
    setErro('')
  }

  async function gerar() {
    if (!templateSelecionado || !fotoLocal || !formato) return
    if (!templateSelecionado.arte_url) {
      setErro('Este template ainda não tem arte configurada pelo administrador.')
      return
    }

    setGerando(true); setErro(''); setPronto(false)
    const { w, h } = DIMS[formato]
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = w
    canvas.height = h

    try {
      const foto = await carregarImagem(fotoLocal)
      const fotoX = Math.round(w * templateSelecionado.foto_x / 100)
      const fotoY = Math.round(h * templateSelecionado.foto_y / 100)
      const fotoW = Math.round(w * templateSelecionado.foto_largura / 100)
      const fotoH = Math.round(h * templateSelecionado.foto_altura / 100)

      ctx.clearRect(0, 0, w, h)

      ctx.save()
      if (templateSelecionado.foto_redondo) {
        ctx.beginPath()
        const rx = fotoX + fotoW / 2
        const ry = fotoY + fotoH / 2
        ctx.arc(rx, ry, Math.min(fotoW, fotoH) / 2, 0, Math.PI * 2)
        ctx.clip()
      } else {
        ctx.beginPath()
        ctx.rect(fotoX, fotoY, fotoW, fotoH)
        ctx.clip()
      }
      const scale = Math.max(fotoW / foto.width, fotoH / foto.height)
      const dw = foto.width * scale; const dh = foto.height * scale
      ctx.drawImage(foto, fotoX + (fotoW - dw) / 2, fotoY + (fotoH - dh) / 2, dw, dh)
      ctx.restore()

      try {
        const art = await carregarImagem(templateSelecionado.arte_url, 'anonymous')
        ctx.drawImage(art, 0, 0, w, h)
      } catch {
        try {
          const art = await carregarImagem(templateSelecionado.arte_url)
          ctx.drawImage(art, 0, 0, w, h)
        } catch {
          setErro('Não foi possível carregar a arte. Verifique se a URL é pública.')
        }
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
      setErro('Não foi possível fazer o download. Tente salvar a imagem manualmente clicando com o botão direito no preview.')
    }
  }

  const inputStyle: React.CSSProperties = { display: 'none' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Minhas Artes</h1>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 32 }}>
        Gere artes profissionais com sua foto para compartilhar nas redes sociais.
      </p>

      {/* PASSO 1 — Escolher formato */}
      <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>1. Escolha o formato</p>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['feed', 'stories'] as Formato[]).map(f => {
            const d = DIMS[f]
            const ativo = formato === f
            return (
              <button
                key={f}
                onClick={() => selecionarFormato(f)}
                style={{
                  flex: 1, background: ativo ? 'var(--grad-brand)' : 'var(--avp-black)',
                  border: `2px solid ${ativo ? 'transparent' : 'var(--avp-border)'}`,
                  borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
                  color: ativo ? '#fff' : 'var(--avp-text)', textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>
                  {f === 'feed' ? '🖼️' : '📱'}
                </div>
                <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{d.label}</p>
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  {f === 'feed' ? '1080 × 1080 px · Quadrado' : '1080 × 1920 px · Vertical'}
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {f === 'feed' ? 'Instagram Feed, Facebook' : 'Instagram Stories, WhatsApp'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {formato && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Coluna esquerda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* PASSO 2 — Template */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>2. Escolha a arte ({DIMS[formato].label})</p>
              {templatesFiltrados.length === 0 ? (
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Nenhum template de {DIMS[formato].label} configurado ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {templatesFiltrados.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setTemplateSelecionado(t); setPronto(false) }}
                      style={{
                        background: templateSelecionado?.id === t.id ? 'var(--grad-brand)' : 'var(--avp-black)',
                        border: `1px solid ${templateSelecionado?.id === t.id ? 'transparent' : 'var(--avp-border)'}`,
                        borderRadius: 8, padding: '11px 14px', color: '#fff',
                        cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: 14,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        {t.tipo.includes('boas_vindas') ? '🎉' : t.tipo.includes('gestor') ? '🏆' : '⭐'}
                      </span>
                      {t.titulo.replace(' (Stories)', '').replace(' (Feed)', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PASSO 3 — Foto */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>3. Envie sua foto</p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 14 }}>Use uma foto de rosto com boa iluminação e fundo neutro.</p>
              <input ref={inputFotoRef} type="file" accept="image/*" onChange={selecionarFoto} style={inputStyle} />
              <button
                onClick={() => inputFotoRef.current?.click()}
                style={{
                  width: '100%', background: 'var(--avp-black)', border: '2px dashed var(--avp-border)',
                  borderRadius: 10, padding: 20, cursor: 'pointer', color: 'var(--avp-text-dim)',
                  fontSize: 14, textAlign: 'center',
                }}
              >
                {fotoLocal
                  ? <img src={fotoLocal} alt="foto" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', display: 'block', margin: '0 auto 8px' }} />
                  : <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>📷</span>}
                {fotoLocal ? 'Clique para trocar a foto' : 'Clique para selecionar sua foto'}
              </button>
            </div>

            {/* Gerar */}
            <button
              onClick={gerar}
              disabled={gerando || !templateSelecionado || !fotoLocal}
              style={{
                background: 'var(--grad-brand)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '14px', fontWeight: 800, fontSize: 16,
                cursor: (gerando || !templateSelecionado || !fotoLocal) ? 'not-allowed' : 'pointer',
                opacity: (gerando || !templateSelecionado || !fotoLocal) ? 0.55 : 1,
              }}
            >
              {gerando ? '⏳ Gerando...' : '✨ Gerar Arte'}
            </button>

            {erro && (
              <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '12px 16px', color: 'var(--avp-danger)', fontSize: 13 }}>
                {erro}
              </div>
            )}
          </div>

          {/* Coluna direita — preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Preview — {DIMS[formato].label}</p>
              <div style={{ position: 'relative', width: '100%', aspectRatio: DIMS[formato].ratio, background: 'var(--avp-black)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--avp-border)' }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                />
                {!pronto && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--avp-text-dim)', fontSize: 14 }}>
                    <span style={{ fontSize: 40, marginBottom: 12 }}>🎨</span>
                    Selecione template e foto, depois clique em Gerar
                  </div>
                )}
              </div>
            </div>
            {pronto && (
              <button
                onClick={baixar}
                style={{
                  background: 'var(--avp-green)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '14px', fontWeight: 800, fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ⬇️ Baixar Arte em PNG
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
