'use client'
import { useRef, useState } from 'react'

type Template = {
  id: string; tipo: string; titulo: string; arte_url: string;
  foto_x: number; foto_y: number; foto_largura: number; foto_altura: number;
  foto_redondo: boolean;
}

const CANVAS_W = 1920
const CANVAS_H = 1080

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
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
  const [fotoLocal, setFotoLocal] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [erro, setErro] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFotoLocal(url)
    setPronto(false)
    setErro('')
  }

  async function gerar() {
    if (!templateSelecionado || !fotoLocal) { setErro('Selecione um template e envie sua foto.'); return }
    if (!templateSelecionado.arte_url) { setErro('Este template ainda não tem arte configurada pelo administrador.'); return }

    setGerando(true); setErro(''); setPronto(false)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    try {
      const foto = await carregarImagem(fotoLocal)
      const fotoX = Math.round(CANVAS_W * templateSelecionado.foto_x / 100)
      const fotoY = Math.round(CANVAS_H * templateSelecionado.foto_y / 100)
      const fotoW = Math.round(CANVAS_W * templateSelecionado.foto_largura / 100)
      const fotoH = Math.round(CANVAS_H * templateSelecionado.foto_altura / 100)

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_W)

      // Desenha a foto do consultor na posição configurada
      ctx.save()
      if (templateSelecionado.foto_redondo) {
        ctx.beginPath()
        const rx = fotoX + fotoW / 2; const ry = fotoY + fotoH / 2
        const r = Math.min(fotoW, fotoH) / 2
        ctx.arc(rx, ry, r, 0, Math.PI * 2)

        ctx.clip()
      } else {
        ctx.rect(fotoX, fotoY, fotoW, fotoH)
        ctx.clip()
      }
      // Cover-fit da foto
      const scale = Math.max(fotoW / foto.width, fotoH / foto.height)
      const drawW = foto.width * scale; const drawH = foto.height * scale
      const drawX = fotoX + (fotoW - drawW) / 2; const drawY = fotoY + (fotoH - drawH) / 2
      ctx.drawImage(foto, drawX, drawY, drawW, drawH)
      ctx.restore()

      // Tenta desenhar o template PNG por cima (transparência preservada)
      try {
        const template = await carregarImagem(templateSelecionado.arte_url, 'anonymous')
        ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H)
      } catch {
        // Se CORS bloquear, tenta sem crossOrigin (não permitirá download mas mostra preview)
        try {
          const template = await carregarImagem(templateSelecionado.arte_url)
          ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H)
        } catch {
          setErro('Não foi possível carregar a arte. Verifique se a URL é pública.')
        }
      }

      setPronto(true)
    } catch (e) {
      setErro('Erro ao gerar a arte. Verifique sua foto.')
    }
    setGerando(false)
  }

  function baixar() {
    const canvas = canvasRef.current!
    try {
      const link = document.createElement('a')
      link.download = `arte-${templateSelecionado?.tipo || 'avp'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      setErro('Não foi possível fazer o download (problema de CORS na arte). Tente salvar a imagem manualmente.')
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Minhas Artes</h1>
      <p style={{ color: 'var(--avp-text-dim)', fontSize: 15, marginBottom: 32 }}>
        Gere artes profissionais personalizadas com sua foto para compartilhar nas redes sociais.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Coluna esquerda: seleção */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Escolher template */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>1. Escolha a arte</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTemplateSelecionado(t); setPronto(false) }}
                  style={{
                    background: templateSelecionado?.id === t.id ? 'var(--grad-brand)' : 'var(--avp-black)',
                    border: `1px solid ${templateSelecionado?.id === t.id ? 'transparent' : 'var(--avp-border)'}`,
                    borderRadius: 8, padding: '12px 16px', color: '#fff', cursor: 'pointer',
                    textAlign: 'left', fontWeight: 600, fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {t.tipo === 'boas_vindas' ? '🎉' : t.tipo === 'novo_gestor' ? '🏆' : '⭐'}
                  </span>
                  {t.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Upload foto */}
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>2. Envie sua foto</p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 16 }}>Use uma foto de rosto com boa iluminação.</p>
            <input ref={inputFotoRef} type="file" accept="image/*" onChange={selecionarFoto} style={{ display: 'none' }} />
            <button
              onClick={() => inputFotoRef.current?.click()}
              style={{ width: '100%', background: 'var(--avp-black)', border: '2px dashed var(--avp-border)', borderRadius: 10, padding: 24, cursor: 'pointer', color: 'var(--avp-text-dim)', fontSize: 14, textAlign: 'center' }}
            >
              {fotoLocal
                ? <img src={fotoLocal} alt="foto" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', display: 'block', margin: '0 auto 8px' }} />
                : <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>📷</span>}
              {fotoLocal ? 'Clique para trocar a foto' : 'Clique para selecionar a foto'}
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
              opacity: (gerando || !templateSelecionado || !fotoLocal) ? 0.6 : 1,
            }}
          >
            {gerando ? '⏳ Gerando arte...' : '✨ Gerar Arte'}
          </button>

          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid var(--avp-danger)', borderRadius: 8, padding: '12px 16px', color: 'var(--avp-danger)', fontSize: 13 }}>
              {erro}
            </div>
          )}
        </div>

        {/* Coluna direita: preview + download */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 12, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Preview</p>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%', height: 'auto', borderRadius: 10,
                border: '1px solid var(--avp-border)',
                display: 'block',
                background: pronto ? 'transparent' : 'var(--avp-black)',
                aspectRatio: '16 / 9',
              }}
            />
            {!pronto && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--avp-text-dim)', fontSize: 14 }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🎨</p>
                Selecione um template e sua foto, depois clique em "Gerar Arte"
              </div>
            )}
          </div>
          {pronto && (
            <button
              onClick={baixar}
              style={{
                background: 'var(--avp-green)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '14px', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              ⬇️ Baixar Arte (PNG)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
