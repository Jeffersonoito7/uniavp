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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const todosAceitos = aceitos.every(Boolean)
  const bg = 'linear-gradient(135deg, #020d1a 0%, #03183a 60%, #021a0e 100%)'

  useEffect(() => {
    if (etapa === 'carteira' && registro) gerarCard()
  }, [etapa, registro])

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
      setEtapa('carteira')
    } else {
      setErro(data.error ?? 'Erro ao assinar.')
    }
    setLoading(false)
  }

  function gerarCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 900; const H = 540
    canvas.width = W; canvas.height = H

    // Fundo
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#0a1628')
    grad.addColorStop(0.5, '#0d2040')
    grad.addColorStop(1, '#051a0e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Faixa lateral esquerda verde
    const faixa = ctx.createLinearGradient(0, 0, 0, H)
    faixa.addColorStop(0, '#02A153')
    faixa.addColorStop(1, '#017a3e')
    ctx.fillStyle = faixa
    ctx.fillRect(0, 0, 12, H)

    // Faixa lateral direita dourada
    const faixaD = ctx.createLinearGradient(0, 0, 0, H)
    faixaD.addColorStop(0, '#b8860b')
    faixaD.addColorStop(1, '#8b6914')
    ctx.fillStyle = faixaD
    ctx.fillRect(W - 12, 0, 12, H)

    // Linha divisória decorativa
    ctx.strokeStyle = 'rgba(2,161,83,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(30, 80); ctx.lineTo(W - 30, 80); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(30, H - 80); ctx.lineTo(W - 30, H - 80); ctx.stroke()

    // CNCPV título
    ctx.fillStyle = '#02A153'
    ctx.font = 'bold 52px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CNCPV', W / 2, 60)

    // Subtítulo
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '14px Inter, Arial, sans-serif'
    ctx.fillText('CARTEIRA NACIONAL DO CONSULTOR DE PROTEÇÃO VEICULAR', W / 2, 76)

    // Avatar circular
    ctx.beginPath()
    ctx.arc(140, 280, 80, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(2,161,83,0.15)'
    ctx.fill()
    ctx.strokeStyle = '#02A153'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '56px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('👤', 140, 300)

    // Nome
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    const nome = form.nome.toUpperCase()
    ctx.fillText(nome.length > 28 ? nome.substring(0, 28) + '...' : nome, 250, 240)

    // CPF mascarado
    if (form.cpf) {
      const cpfLimpo = form.cpf.replace(/\D/g, '')
      const cpfMask = cpfLimpo.length === 11
        ? `${cpfLimpo.slice(0,3)}.${cpfLimpo.slice(3,6)}.${cpfLimpo.slice(6,9)}-${cpfLimpo.slice(9)}`
        : form.cpf
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '16px Inter, Arial, sans-serif'
      ctx.fillText(`CPF: ${cpfMask}`, 250, 272)
    }

    // Número de registro
    ctx.fillStyle = '#02A153'
    ctx.font = 'bold 22px Inter, Arial, sans-serif'
    ctx.fillText(registro, 250, 308)

    // Data de emissão
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '14px Inter, Arial, sans-serif'
    ctx.fillText(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 250, 336)

    // Linha divisória
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(250, 355); ctx.lineTo(720, 355); ctx.stroke()

    // Declaração
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '12px Inter, Arial, sans-serif'
    ctx.fillText('Consultor habilitado — Contrato CNCPV assinado digitalmente', 250, 376)
    ctx.fillText(`Verificar em: uniavp.autovaleprevencoes.org.br/cncpv/verificar/${registro}`, 250, 396)

    // Selos
    const selos = ['ÉTICO', 'HABILITADO', 'CERTIFICADO']
    selos.forEach((s, i) => {
      const x = 250 + i * 160
      ctx.fillStyle = 'rgba(2,161,83,0.15)'
      ctx.beginPath()
      ctx.roundRect(x, 420, 130, 36, 6)
      ctx.fill()
      ctx.strokeStyle = 'rgba(2,161,83,0.4)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = '#02A153'
      ctx.font = 'bold 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`✓ ${s}`, x + 65, 443)
    })

    // Logo site (canto superior direito)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = 'bold 18px Inter, Arial, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(siteNome || 'UNIAVP', W - 30, 50)

    // QR placeholder
    ctx.fillStyle = '#fff'
    ctx.fillRect(W - 130, H - 140, 100, 100)
    ctx.fillStyle = '#000'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('QR CODE', W - 80, H - 85)
    ctx.fillText('VERIFICAR', W - 80, H - 72)
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
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>CPF</label>
                <input style={inp} value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>WhatsApp *</label>
                <input style={inp} value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-mail *</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
              </div>
              <button
                onClick={() => setEtapa('termos')}
                disabled={!form.nome || !form.whatsapp || !form.email}
                style={{ background: !form.nome || !form.whatsapp || !form.email ? 'rgba(2,161,83,0.3)' : 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontWeight: 800, fontSize: 16, cursor: !form.nome || !form.whatsapp || !form.email ? 'not-allowed' : 'pointer', marginTop: 8, boxShadow: '0 8px 32px rgba(2,161,83,0.3)' }}>
                Avançar para os Termos →
              </button>
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
            <div style={{ width: `${(aceitos.filter(Boolean).length / TERMOS.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #02A153, #22c55e)', borderRadius: 100, transition: 'width 0.3s' }} />
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

          {erro && (
            <div style={{ background: '#e6394620', border: '1px solid #e63946', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setEtapa('form')}
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              ← Voltar
            </button>
            <button onClick={assinar} disabled={!todosAceitos || loading}
              style={{ flex: 2, background: !todosAceitos ? 'rgba(2,161,83,0.3)' : 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 16, cursor: !todosAceitos || loading ? 'not-allowed' : 'pointer', boxShadow: todosAceitos ? '0 8px 32px rgba(2,161,83,0.4)' : 'none', transition: 'all 0.2s' }}>
              {loading ? '⏳ Assinando...' : todosAceitos ? '🪪 Assinar e Emitir Carteira CNCPV' : `Aceite todos os ${TERMOS.length} itens para continuar`}
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
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
          Contrato assinado digitalmente em {new Date().toLocaleString('pt-BR')}
        </p>

        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: 680, borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', display: 'block', margin: '0 auto 24px' }} />

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={baixarCard}
            style={{ background: 'linear-gradient(135deg, #02A153, #059669)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 32px rgba(2,161,83,0.4)' }}>
            ⬇️ Baixar Carteira CNCPV
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/cncpv/verificar/${registro}`)
            alert('Link de verificação copiado!')
          }}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            🔗 Copiar link de verificação
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>
          Guarde seu número de registro: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{registro}</strong>
        </p>
      </div>
    </div>
  )
}
