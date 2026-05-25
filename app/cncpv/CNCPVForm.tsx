'use client'
import { useState, useRef, useEffect } from 'react'

const TERMOS = [
  'Não prometerei coberturas ou benefícios que a associação não oferece, sob pena de rescisão e reembolso de bônus.',
  'Manterei exclusividade com a CONTRATANTE e não atuarei em associações concorrentes de proteção veicular enquanto o contrato vigorar.',
  'Não usarei o nome, logotipo ou marca da associação em publicações sem autorização expressa (multa de R$2.000 por publicação indevida).',
  'Não registrarei filiações em nome de cônjuge, parente ou terceiros para obter vantagem — esta conduta é considerada fraude.',
  'Estou ciente de que se o associado não pagar o 1º boleto, 1 placa será descontada da minha meta no mês seguinte.',
  'Se receber o bônus de plotagem de veículo, manterei a plotagem por no mínimo 6 meses — caso contrário, devolverei todos os valores recebidos.',
  'Inatividade superior a 10 dias corridos sem intermediar negócios constitui motivo de rescisão automática do contrato.',
  'Caso não preste suporte, treinamento e engajamento adequados à minha equipe, a associação poderá redistribuir os consultores sem minha anuência.',
  'Mantenho sigilo de 5 anos sobre processos, estratégias, valores e base de clientes da associação, mesmo após o encerramento do contrato.',
  'Não captarei associados de outras associações nem levarei minha base de clientes para concorrentes — multa de 40 salários mínimos.',
]

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

function formatarCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function formatarWhatsApp(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function validarWhatsApp(w: string): boolean {
  const d = w.replace(/\D/g, '')
  return d.length >= 10 && d.length <= 13
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

type Props = {
  nomeInicial?: string
  whatsappInicial?: string
  emailInicial?: string
  cpfInicial?: string
  alunoId?: string
  logoUrl?: string
  siteNome?: string
}

export default function CNCPVForm({ nomeInicial = '', whatsappInicial = '', emailInicial = '', cpfInicial = '', alunoId, logoUrl, siteNome }: Props) {
  const [etapa, setEtapa] = useState<'form' | 'termos' | 'carteira'>('form')
  const [form, setForm] = useState({ nome: nomeInicial, whatsapp: whatsappInicial, email: emailInicial, cpf: cpfInicial })
  const [aceitos, setAceitos] = useState<boolean[]>(new Array(TERMOS.length).fill(false))
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [registro, setRegistro] = useState('')
  const [hashContrato, setHashContrato] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [wppEnviado, setWppEnviado] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const todosAceitos = aceitos.every(Boolean)
  const bg = '#0a0a0f'

  useEffect(() => {
    if (etapa === 'carteira' && registro) { gerarCard() }
  }, [etapa, registro, hashContrato])

  async function assinar() {
    setLoading(true); setErro('')
    const res = await fetch('/api/cncpv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome, cpf: form.cpf, whatsapp: form.whatsapp,
        email: form.email, aluno_id: alunoId ?? null,
        termos_aceitos: TERMOS,
      }),
    })
    const data = await res.json()
    if (data.ok) {
      setRegistro(data.numero_registro)
      setHashContrato(data.hash_contrato ?? '')
      setPdfUrl(data.pdf_url ?? '')
      setWppEnviado(!data.jaExistia)
      setEtapa('carteira')
    } else {
      setErro(data.error ?? 'Erro ao assinar.')
    }
    setLoading(false)
  }

  async function gerarCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 1012; const H = 638  // proporção cartão físico (85.6mm x 53.98mm @ 300dpi)
    canvas.width = W; canvas.height = H

    // ── FUNDO BASE ─────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#06101f')
    bgGrad.addColorStop(0.45, '#091828')
    bgGrad.addColorStop(1, '#04130d')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // ── GUILHOCHÉ — padrão de segurança (linhas senoidais sobrepostas) ──
    ctx.save()
    for (let i = 0; i < 28; i++) {
      ctx.beginPath()
      for (let x = 0; x <= W; x += 1) {
        const y = (H * 0.35) + Math.sin(x * 0.018 + i * 0.38) * (14 + i * 1.1)
          + Math.cos(x * 0.011 + i * 0.22) * 8
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = i % 2 === 0 ? `rgba(200,165,53,0.05)` : `rgba(2,161,83,0.04)`
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
    // Guilhoché vertical
    for (let i = 0; i < 14; i++) {
      ctx.beginPath()
      for (let y = 0; y <= H; y += 1) {
        const x = (W * 0.5) + Math.sin(y * 0.022 + i * 0.5) * (12 + i * 1.8)
        if (y === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(255,255,255,0.02)`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
    ctx.restore()

    // ── MARCA D'ÁGUA diagonal ───────────────────────────────────────
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 5)
    ctx.font = 'bold 110px Arial, sans-serif'
    ctx.fillStyle = 'rgba(2,161,83,0.055)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CNCPV', 0, -60)
    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillText('CARTEIRA NACIONAL DO CONSULTOR DE PROTEÇÃO VEICULAR', 0, 20)
    ctx.restore()

    // ── BORDA EXTERNA (cartão físico) ───────────────────────────────
    ctx.save()
    const r = 24
    ctx.beginPath()
    ctx.moveTo(r, 0); ctx.lineTo(W - r, 0)
    ctx.quadraticCurveTo(W, 0, W, r)
    ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H)
    ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r)
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.clip()

    // Repinta o fundo após clip
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // ── FAIXA SUPERIOR DOURADA ──────────────────────────────────────
    const topGrad = ctx.createLinearGradient(0, 0, W, 0)
    topGrad.addColorStop(0, '#8b6914')
    topGrad.addColorStop(0.3, '#c8a535')
    topGrad.addColorStop(0.7, '#e8c04a')
    topGrad.addColorStop(1, '#8b6914')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, 58)

    // Linha verde abaixo da faixa dourada
    ctx.fillStyle = '#02A153'
    ctx.fillRect(0, 58, W, 5)

    // ── TÍTULO NO HEADER ───────────────────────────────────────────
    ctx.fillStyle = '#000'
    ctx.font = 'bold 11px Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '2px'
    ctx.fillText(siteNome ? siteNome.toUpperCase() : 'PROTEÇÃO VEICULAR', 22, 20)
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.fillText('CARTEIRA NACIONAL DO CONSULTOR DE PROTEÇÃO VEICULAR', 22, 38)

    ctx.textAlign = 'right'
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.fillStyle = '#0a1628'
    ctx.fillText('CNCPV', W - 22, 40)

    // ── ÁREA DA FOTO ────────────────────────────────────────────────
    const photoX = 28; const photoY = 80; const photoW = 155; const photoH = 195
    // Moldura foto com borda dupla (estilo documento)
    ctx.fillStyle = '#fff'
    ctx.fillRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6)
    ctx.fillStyle = '#c8a535'
    ctx.fillRect(photoX - 6, photoY - 6, photoW + 12, photoH + 12)
    ctx.fillStyle = '#fff'
    ctx.fillRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6)

    // Silhueta da foto
    const photoGrad = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH)
    photoGrad.addColorStop(0, '#1a2a3a')
    photoGrad.addColorStop(1, '#0d1e2e')
    ctx.fillStyle = photoGrad
    ctx.fillRect(photoX, photoY, photoW, photoH)

    // Ícone pessoa na foto
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.arc(photoX + photoW / 2, photoY + 75, 38, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.ellipse(photoX + photoW / 2, photoY + photoH + 10, 55, 40, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(200,165,53,0.3)'
    ctx.font = '42px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('👤', photoX + photoW / 2, photoY + 85)

    ctx.fillStyle = 'rgba(200,165,53,0.6)'
    ctx.font = 'bold 9px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('FOTO DO CONSULTOR', photoX + photoW / 2, photoY + photoH - 10)

    // ── ÁREA DE DADOS ───────────────────────────────────────────────
    const dx = 205
    const labelStyle = () => {
      ctx.fillStyle = '#c8a535'
      ctx.font = 'bold 9px Arial, sans-serif'
    }
    const valueStyle = (big = false) => {
      ctx.fillStyle = '#ffffff'
      ctx.font = `${big ? 'bold 19px' : '13px'} Arial, sans-serif`
    }

    const sep = (y: number) => {
      ctx.strokeStyle = 'rgba(200,165,53,0.25)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(dx, y); ctx.lineTo(W - 22, y); ctx.stroke()
    }

    // ── NOME COMPLETO ──
    labelStyle(); ctx.textAlign = 'left'
    ctx.fillText('NOME COMPLETO', dx, 96)
    valueStyle(true)
    const nomeUp = form.nome.toUpperCase()
    ctx.fillText(nomeUp.length > 28 ? nomeUp.slice(0, 28) + '…' : nomeUp, dx, 116)
    sep(126)

    // ── CPF ──
    labelStyle()
    ctx.fillText('CPF', dx, 142)
    valueStyle()
    if (form.cpf) {
      const d = form.cpf.replace(/\D/g, '')
      const mask = d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : form.cpf
      ctx.fillText(mask, dx, 157)
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillText('Não informado', dx, 157)
    }

    // DATA DE EMISSÃO (lado direito)
    labelStyle()
    ctx.fillText('EMISSÃO', dx + 320, 142)
    valueStyle()
    ctx.fillText(new Date().toLocaleDateString('pt-BR'), dx + 320, 157)
    sep(168)

    // ── NOME DA ASSOCIAÇÃO ──
    labelStyle()
    ctx.fillText('ASSOCIAÇÃO CREDENCIADORA', dx, 184)
    ctx.fillStyle = '#c8a535'
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.textAlign = 'left'
    const assocNome = siteNome ? siteNome.toUpperCase() : 'PROTEÇÃO VEICULAR'
    ctx.fillText(assocNome.length > 38 ? assocNome.slice(0, 38) + '…' : assocNome, dx, 199)
    sep(210)

    // ── Nº REGISTRO (ID auto) ──
    labelStyle()
    ctx.fillText('Nº REGISTRO / ID', dx, 226)
    ctx.fillStyle = '#02A153'
    ctx.font = 'bold 20px Arial, sans-serif'
    ctx.fillText(registro, dx, 248)

    // VALIDADE
    const validadeAno = new Date().getFullYear() + 2
    labelStyle()
    ctx.fillText('VALIDADE', dx + 320, 226)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Arial, sans-serif'
    ctx.fillText(`12/${validadeAno}`, dx + 320, 248)
    sep(260)

    // HABILITAÇÕES / CATEGORIAS
    labelStyle()
    ctx.fillText('HABILITAÇÕES', dx, 276)
    const habs = [
      { cod: 'C', desc: 'Captação' },
      { cod: 'T', desc: 'Treinamento' },
      { cod: 'G', desc: 'Gestão de Equipe' },
    ]
    habs.forEach((h, i) => {
      const hx = dx + i * 165
      ctx.fillStyle = '#c8a535'
      ctx.beginPath(); ctx.arc(hx + 14, 293, 13, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#000'
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(h.cod, hx + 14, 298)
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.font = '10px Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(h.desc, hx + 32, 297)
    })

    // ── ASSINATURA DIGITAL ──────────────────────────────────────────
    ctx.strokeStyle = 'rgba(200,165,53,0.3)'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(dx, 320); ctx.lineTo(dx + 320, 320); ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '9px Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('ASSINATURA DIGITAL — CONTRATO CNCPV ACEITO', dx, 332)
    ctx.strokeStyle = 'rgba(200,165,53,0.5)'; ctx.lineWidth = 1.5
    ctx.beginPath()
    const asx = dx; const asy = 316
    ctx.moveTo(asx, asy); ctx.bezierCurveTo(asx+30, asy-14, asx+60, asy+10, asx+90, asy-8)
    ctx.bezierCurveTo(asx+120, asy-22, asx+150, asy+6, asx+185, asy-4)
    ctx.bezierCurveTo(asx+210, asy-14, asx+240, asy+8, asx+270, asy-2)
    ctx.stroke()

    // ── FAIXA INFERIOR VERDE ────────────────────────────────────────
    ctx.fillStyle = '#02A153'
    ctx.fillRect(0, H - 68, W, 5)

    const botGrad = ctx.createLinearGradient(0, H - 63, W, 0)
    botGrad.addColorStop(0, '#06101f')
    botGrad.addColorStop(1, '#04130d')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, H - 63, W, 63)

    // Microtexto de segurança no rodapé
    ctx.fillStyle = 'rgba(200,165,53,0.35)'
    ctx.font = '7px Arial, sans-serif'
    ctx.textAlign = 'center'
    const micro = 'CNCPV · PROTEÇÃO VEICULAR · HABILITADO · '
    ctx.fillText(micro.repeat(8), W / 2, H - 46)
    ctx.fillText(micro.repeat(8), W / 2, H - 36)

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px Arial, sans-serif'
    ctx.fillText(`Verificar: cncpv.com.br/verificar/${registro}  |  Emitido em ${new Date().toLocaleDateString('pt-BR')}`, W / 2, H - 20)

    // Hash SHA-256 (prova de integridade)
    if (hashContrato) {
      ctx.fillStyle = 'rgba(200,165,53,0.45)'
      ctx.font = '7.5px monospace'
      ctx.fillText(`SHA-256: ${hashContrato}`, W / 2, H - 7)
    }

    // ── QR CODE real (canto inferior direito) ────────────────────────
    const qx = W - 108; const qy = H - 148; const qSize = 90
    const verUrl = `${window.location.origin}/cncpv/verificar/${registro}`
    await new Promise<void>(resolve => {
      const qrImg = new Image()
      // Gera QR via API pública (não requer lib client)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verUrl)}&color=141414&bgcolor=ffffff&margin=1`
      qrImg.crossOrigin = 'anonymous'
      qrImg.onload = () => {
        ctx.fillStyle = '#fff'
        ctx.fillRect(qx - 4, qy - 4, qSize + 8, qSize + 8)
        ctx.drawImage(qrImg, qx, qy, qSize, qSize)
        ctx.strokeStyle = '#c8a535'; ctx.lineWidth = 2
        ctx.strokeRect(qx - 4, qy - 4, qSize + 8, qSize + 8)
        ctx.fillStyle = 'rgba(200,165,53,0.7)'
        ctx.font = 'bold 7px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('VERIFICAR', qx + qSize / 2, qy + qSize + 6)
        resolve()
      }
      qrImg.onerror = () => resolve()
      qrImg.src = qrApiUrl
    })

    // ── HOLOGRAMA (canto superior direito) ─────────────────────────
    const holX = W - 58; const holY = 120
    for (let i = 0; i < 16; i++) {
      const hue = (i * 22) % 360
      ctx.beginPath()
      ctx.arc(holX, holY, 44 - i * 2.5, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.18)`
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(holX, holY, 46, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(200,165,53,0.6)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath(); ctx.arc(holX, holY, 44, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(200,165,53,0.7)'
    ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'
    ctx.fillText('✦', holX, holY - 4)
    ctx.fillText('HOLO', holX, holY + 8)

    // ── FAIXA MAGNÉTICA (topo da área de foto) ──────────────────────
    const stripGrad = ctx.createLinearGradient(0, 0, W, 0)
    stripGrad.addColorStop(0, '#1a1a1a'); stripGrad.addColorStop(0.5, '#333'); stripGrad.addColorStop(1, '#1a1a1a')
    ctx.fillStyle = stripGrad
    ctx.fillRect(0, 290, 28, 120)

    ctx.restore() // remove clip
  }

  function baixarCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `CNCPV-${form.nome.replace(/\s/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // ── ETAPA 1: FORMULÁRIO ──────────────────────────────────────────
  if (etapa === 'form') {
    const inp: React.CSSProperties = {
      width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none',
      boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
    }
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-block', background: 'rgba(2,161,83,0.15)', border: '2px solid #02A153', borderRadius: 16, padding: '12px 32px', marginBottom: 16 }}>
              <p style={{ fontWeight: 900, fontSize: 36, color: '#02A153', margin: 0, letterSpacing: 4 }}>CNCPV</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', letterSpacing: 1 }}>CARTEIRA NACIONAL DO CONSULTOR</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: 1 }}>DE PROTEÇÃO VEICULAR</p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
              Preencha seus dados para acessar os termos e emitir sua carteira profissional.
            </p>
          </div>

          <div style={{ background: 'rgba(10,22,40,0.85)', border: '1px solid rgba(2,161,83,0.25)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nome completo *</label>
                <input style={inp} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome completo" />
              </div>
              {(() => {
                const cpfLen = form.cpf.replace(/\D/g,'').length
                const cpfOk = validarCPF(form.cpf)
                const wppLen = form.whatsapp.replace(/\D/g,'').length
                const wppOk = validarWhatsApp(form.whatsapp)
                const emailOk = !form.email || validarEmail(form.email)
                const podeAvancar = form.nome && wppOk && form.email && validarEmail(form.email) && form.cpf && cpfOk
                const lbl2: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }
                return (
                  <>
                    <div>
                      <label style={lbl2}>
                        CPF *
                        {cpfLen === 11 && (
                          <span style={{ marginLeft: 8, color: cpfOk ? '#22c55e' : '#f87171', fontWeight: 700 }}>
                            {cpfOk ? '✓ válido' : '✗ inválido'}
                          </span>
                        )}
                      </label>
                      <input
                        style={{ ...inp, borderColor: cpfLen === 11 && !cpfOk ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
                        value={form.cpf}
                        onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))}
                        placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label style={lbl2}>
                        WhatsApp *
                        {wppLen >= 10 && (
                          <span style={{ marginLeft: 8, color: wppOk ? '#22c55e' : '#f87171', fontWeight: 700 }}>
                            {wppOk ? '✓ válido' : '✗ inválido'}
                          </span>
                        )}
                      </label>
                      <input
                        style={{ ...inp, borderColor: wppLen >= 10 && !wppOk ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
                        value={form.whatsapp}
                        onChange={e => setForm(p => ({ ...p, whatsapp: formatarWhatsApp(e.target.value) }))}
                        placeholder="(87) 99999-9999" />
                    </div>
                    <div>
                      <label style={lbl2}>
                        E-mail *
                        {form.email.length > 4 && (
                          <span style={{ marginLeft: 8, color: emailOk ? '#22c55e' : '#f87171', fontWeight: 700 }}>
                            {emailOk ? '✓ válido' : '✗ inválido'}
                          </span>
                        )}
                      </label>
                      <input
                        style={{ ...inp, borderColor: form.email.length > 4 && !emailOk ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.15)' }}
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="seu@email.com" />
                    </div>
                    <button
                      onClick={() => setEtapa('termos')}
                      disabled={!podeAvancar}
                      className="btn btn-green btn-full btn-lg" style={{ marginTop: 8 }}>
                      Avançar para os Termos
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA 2: TERMOS ──────────────────────────────────────────────
  if (etapa === 'termos') {
    return (
      <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Inter, sans-serif', padding: '32px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontWeight: 900, fontSize: 24, color: '#02A153', letterSpacing: 3, margin: '0 0 4px' }}>CNCPV</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Termos de Conduta Profissional</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
              Leia cada item e marque que está ciente. Todos são obrigatórios.
            </p>
          </div>

          {/* Progresso */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 6, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ width: `${(aceitos.filter(Boolean).length / TERMOS.length) * 100}%`, height: '100%', background: '#22c55e', borderRadius: 100, transition: 'width 0.3s' }} />
          </div>
          <p style={{ color: aceitos.filter(Boolean).length === TERMOS.length ? '#22c55e' : 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 20, fontWeight: 600 }}>
            {aceitos.filter(Boolean).length}/{TERMOS.length} itens confirmados
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {TERMOS.map((termo, i) => (
              <label key={i}
                style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: aceitos[i] ? 'rgba(2,161,83,0.1)' : 'rgba(10,22,40,0.8)', border: `1px solid ${aceitos[i] ? 'rgba(2,161,83,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${aceitos[i] ? '#02A153' : 'rgba(255,255,255,0.25)'}`, background: aceitos[i] ? '#02A153' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                  {aceitos[i] && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
                </div>
                <input type="checkbox" checked={aceitos[i]} onChange={e => { const n = [...aceitos]; n[i] = e.target.checked; setAceitos(n) }} style={{ display: 'none' }} />
                <div>
                  <p style={{ fontSize: 11, color: '#02A153', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Ponto {i + 1} — Estou ciente</p>
                  <p style={{ fontSize: 14, color: aceitos[i] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>{termo}</p>
                </div>
              </label>
            ))}
          </div>

          {erro && <div className="alert alert-error" style={{ marginBottom: 16, textAlign: 'center' }}>{erro}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setEtapa('form')} className="btn btn-ghost" style={{ flex: 1 }}>
              ← Voltar
            </button>
            <button onClick={assinar} disabled={!todosAceitos || loading} className="btn btn-green" style={{ flex: 2, fontSize: 15 }}>
              {loading ? 'Assinando...' : todosAceitos ? 'Assinar e Emitir Carteira CNCPV' : `Aceite todos os ${TERMOS.length} itens para continuar`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ETAPA 3: CARTEIRA ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Inter, sans-serif', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 680, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#02A153', marginBottom: 8 }}>Carteira emitida com sucesso!</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 8 }}>
          Registro: <strong style={{ color: '#fff' }}>{registro}</strong>
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 }}>
          Contrato assinado digitalmente em {new Date().toLocaleString('pt-BR')}
        </p>

        {wppEnviado && (
          <p style={{ color: '#22c55e', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
            📱 Comprovante enviado via WhatsApp
          </p>
        )}

        {hashContrato && (
          <div style={{ background: 'rgba(200,165,53,0.08)', border: '1px solid rgba(200,165,53,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, textAlign: 'left' }}>
            <p style={{ color: 'rgba(200,165,53,0.8)', fontSize: 10, fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
              🔐 Código de autenticidade SHA-256
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all', lineHeight: 1.6 }}>
              {hashContrato}
            </p>
          </div>
        )}

        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 680, borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', display: 'block', margin: '0 auto 24px' }} />

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={baixarCard} className="btn btn-green">
            Baixar Carteira (PNG)
          </button>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-danger" style={{ textDecoration: 'none' }}>
              Baixar Contrato (PDF)
            </a>
          )}
          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/cncpv/verificar/${registro}`)
            alert('Link de verificação copiado!')
          }} className="btn btn-ghost">
            Copiar link de verificação
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>
          Guarde seu número de registro: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{registro}</strong>
        </p>
      </div>
    </div>
  )
}
