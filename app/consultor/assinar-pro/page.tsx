'use client'
import { useEffect, useState } from 'react'

type Info = {
  jaEhPro: boolean
  valorPlano: number
  whatsapp: string | null
  ultimoPagamento: { pix_copia_cola: string; qrcode_base64: string; vencimento: string; status: string } | null
}

export default function AssinarProPage() {
  const [info, setInfo] = useState<Info | null>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [msg, setMsg] = useState('')

  // ── Verificação WhatsApp PRO ─────────────────────────────────────
  const [wppVerificado, setWppVerificado] = useState(false)
  const [wppCodigoEnviado, setWppCodigoEnviado] = useState(false)
  const [wppCodigo, setWppCodigo] = useState('')
  const [wppCarregando, setWppCarregando] = useState(false)
  const [wppErro, setWppErro] = useState('')

  useEffect(() => {
    fetch('/api/consultor/assinar-pro').then(r => r.json()).then(setInfo)
  }, [])

  async function enviarCodigoWpp() {
    if (!info?.whatsapp) return
    setWppCarregando(true); setWppErro('')
    const res = await fetch('/api/verificar-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: info.whatsapp }),
    })
    const data = await res.json()
    if (data.ok) setWppCodigoEnviado(true)
    else setWppErro(data.error ?? 'Erro ao enviar código.')
    setWppCarregando(false)
  }

  async function confirmarCodigoWpp() {
    if (wppCodigo.length < 6 || !info?.whatsapp) return
    setWppCarregando(true); setWppErro('')
    const res = await fetch('/api/verificar-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: info.whatsapp, codigo: wppCodigo }),
    })
    const data = await res.json()
    if (data.verificado) {
      setWppVerificado(true)
      setWppCodigoEnviado(false)
    } else {
      setWppErro(data.error ?? 'Código incorreto.')
      setWppCodigo('')
    }
    setWppCarregando(false)
  }

  async function gerarPix() {
    setGerando(true); setMsg('')
    const res = await fetch('/api/consultor/assinar-pro', { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setInfo(prev => prev ? { ...prev, ultimoPagamento: data.pagamento } : prev)
    } else {
      setMsg(data.error || 'Erro ao gerar cobrança.')
    }
    setGerando(false)
  }

  function copiarPix() {
    if (!info?.ultimoPagamento?.pix_copia_cola) return
    navigator.clipboard.writeText(info.ultimoPagamento.pix_copia_cola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const pag = info?.ultimoPagamento
  const qrSrc = pag?.qrcode_base64
    ? `data:image/png;base64,${pag.qrcode_base64.replace('data:image/png;base64,', '')}`
    : pag?.pix_copia_cola
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pag.pix_copia_cola)}&color=6366f1&bgcolor=ffffff`
      : null

  const valor = info?.valorPlano ?? 97
  const wppFormatado = info?.whatsapp
    ? info.whatsapp.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')
    : null

  // PIX pendente anterior não exige re-verificação
  const temPixPendente = pag?.status === 'pendente'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f1f5', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 100, padding: '6px 20px', fontSize: 13, fontWeight: 800, color: '#818cf8', marginBottom: 20 }}>
            ✨ UNIAVP PRO
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Faça o upgrade agora</h1>
          <p style={{ color: '#8a8fa3', fontSize: 15 }}>Acesso completo + gestão de equipe ilimitada</p>
        </div>

        {/* Já é PRO */}
        {info?.jaEhPro && (
          <div style={{ background: 'rgba(2,161,83,0.1)', border: '1px solid #02A153', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#22c55e', marginBottom: 8 }}>Você já é UNIAVP PRO!</p>
            <a href="/pro" style={{ display: 'inline-block', background: '#22c55e', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              → Acessar painel PRO
            </a>
          </div>
        )}

        {!info?.jaEhPro && (
          <>
            {/* Card do plano */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: '28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 20 }}>Plano PRO</p>
                  <p style={{ color: '#8a8fa3', fontSize: 13, marginTop: 2 }}>Mensal · cancele quando quiser</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: 36, color: '#818cf8', lineHeight: 1 }}>
                    R$ {valor.toFixed(2).replace('.', ',')}
                  </p>
                  <p style={{ color: '#8a8fa3', fontSize: 12 }}>/mês</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  '📚 Aulas ilimitadas', '👥 Equipe ilimitada',
                  '🔗 Links de captação', '📊 Relatórios da equipe',
                  '💬 WhatsApp direto', '🎨 Templates de arte',
                  '🤝 Indicações ilimitadas', '🏆 Certificados',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#c4b5fd' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* PIX pendente → mostra direto sem precisar verificar de novo */}
            {temPixPendente ? (
              <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>⚡ Pague via PIX e ative agora</p>
                <p style={{ color: '#8a8fa3', fontSize: 13, marginBottom: 20 }}>
                  Vence em: {pag!.vencimento ? new Date(pag!.vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </p>
                {qrSrc && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ padding: 12, border: '3px solid #6366f1', borderRadius: 14, background: '#fff' }}>
                      <img src={qrSrc} width={180} height={180} alt="QR Code PIX" style={{ display: 'block' }} />
                    </div>
                  </div>
                )}
                <button onClick={copiarPix}
                  style={{ width: '100%', background: copiado ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
                  {copiado ? '✅ PIX copiado!' : '📋 Copiar PIX Copia e Cola'}
                </button>
                <div style={{ background: 'rgba(2,161,83,0.08)', border: '1px solid rgba(2,161,83,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6ee7b7', lineHeight: 1.6 }}>
                  ✅ Assim que o pagamento for confirmado, seu acesso PRO é ativado automaticamente.
                </div>
              </div>
            ) : (
              /* ── Verificação WhatsApp + Botão PIX ── */
              <div style={{ background: '#181b24', border: '1px solid #252836', borderRadius: 14, padding: '24px' }}>

                {!wppVerificado ? (
                  /* Etapa 1: verificar WhatsApp */
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
                      <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Confirme seu WhatsApp</p>
                      <p style={{ color: '#8a8fa3', fontSize: 13, lineHeight: 1.6 }}>
                        Para garantir que as notificações da sua equipe cheguem no lugar certo, precisamos confirmar seu número.
                      </p>
                    </div>

                    {wppFormatado && (
                      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>📱</span>
                        <div>
                          <p style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, margin: 0 }}>Número cadastrado</p>
                          <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{wppFormatado}</p>
                        </div>
                      </div>
                    )}

                    {!wppCodigoEnviado ? (
                      <>
                        <button onClick={enviarCodigoWpp} disabled={wppCarregando}
                          style={{ width: '100%', background: 'linear-gradient(135deg, #25d366, #128c7e)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}>
                          {wppCarregando ? '⏳ Enviando...' : <><span>📲</span> Enviar código de verificação</>}
                        </button>
                        {wppErro && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{wppErro}</p>}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <p style={{ fontSize: 13, color: '#8a8fa3', textAlign: 'center', margin: 0 }}>
                          📩 Código enviado! Abra seu WhatsApp e digite os 6 dígitos:
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text" inputMode="numeric" maxLength={6}
                            placeholder="000000"
                            value={wppCodigo}
                            onChange={e => setWppCodigo(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => e.key === 'Enter' && confirmarCodigoWpp()}
                            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 12px', color: '#fff', fontSize: 24, fontWeight: 900, textAlign: 'center', letterSpacing: 12, outline: 'none' }}
                          />
                          <button onClick={confirmarCodigoWpp}
                            disabled={wppCarregando || wppCodigo.length < 6}
                            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 800, fontSize: 15, cursor: wppCodigo.length < 6 ? 'not-allowed' : 'pointer', opacity: wppCodigo.length < 6 ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                            {wppCarregando ? '⏳' : '✓ OK'}
                          </button>
                        </div>
                        {wppErro && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', margin: 0 }}>{wppErro}</p>}
                        <button onClick={enviarCodigoWpp} disabled={wppCarregando}
                          style={{ background: 'none', border: 'none', color: '#8a8fa3', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                          Reenviar código →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Etapa 2: WhatsApp verificado → gerar PIX */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22c55e', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                      <span style={{ fontSize: 20 }}>✅</span> WhatsApp verificado!
                    </div>
                    <button onClick={gerarPix} disabled={gerando}
                      style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 12, padding: '18px', fontWeight: 900, fontSize: 18, cursor: gerando ? 'not-allowed' : 'pointer', opacity: gerando ? 0.7 : 1, boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
                      {gerando ? '⏳ Gerando PIX...' : `🚀 Assinar UNIAVP PRO — R$ ${valor.toFixed(2).replace('.', ',')} /mês`}
                    </button>
                  </div>
                )}

                {msg && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{msg}</p>}
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#8a8fa3' }}>
              Pagamento 100% seguro via PIX · Efí Bank
            </p>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/upgrade" style={{ color: '#8a8fa3', fontSize: 13, textDecoration: 'none' }}>← Voltar</a>
        </div>
      </div>
    </div>
  )
}
