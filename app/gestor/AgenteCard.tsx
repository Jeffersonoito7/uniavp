'use client'
import { useState, useEffect } from 'react'

type Pacote = { id: string; nome: string; creditos: number; valor: number }

type DadosAgente = {
  saldo: number
  pacotes: Pacote[]
  agenteAtivo: boolean
  nomeAssistente: string
  instanciaWhatsapp: string | null
}

export default function AgenteCard() {
  const [dados, setDados] = useState<DadosAgente | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [showRecarga, setShowRecarga] = useState(false)
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null)
  const [gerandoPix, setGerandoPix] = useState(false)
  const [pix, setPix] = useState<{ pixCopiaECola: string; qrcodeBase64: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [wppUrl, setWppUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agente/saldo')
      .then(r => r.json())
      .then(d => { setDados(d); setCarregando(false) })
      .catch(() => setCarregando(false))
  }, [])

  useEffect(() => {
    if (dados?.instanciaWhatsapp) {
      const num = dados.instanciaWhatsapp.replace(/\D/g, '')
      const ddi = num.startsWith('55') ? num : `55${num}`
      setWppUrl(`https://wa.me/${ddi}`)
    }
  }, [dados])

  async function gerarPix() {
    if (!pacoteSelecionado) return
    setGerandoPix(true)
    try {
      const res = await fetch('/api/agente/recarregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacoteId: pacoteSelecionado.id }),
      })
      const data = await res.json()
      if (data.ok) {
        setPix({ pixCopiaECola: data.pixCopiaECola, qrcodeBase64: data.qrcodeBase64 })
      }
    } finally {
      setGerandoPix(false)
    }
  }

  function copiarPix() {
    if (!pix) return
    navigator.clipboard.writeText(pix.pixCopiaECola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  function fecharRecarga() {
    setShowRecarga(false)
    setPacoteSelecionado(null)
    setPix(null)
    setCopiado(false)
  }

  if (carregando) return null
  if (!dados || !dados.agenteAtivo) return null

  const saldoBaixo = dados.saldo < 3
  const corSaldo = dados.saldo === 0 ? 'var(--avp-danger)' : saldoBaixo ? '#f59e0b' : 'var(--avp-green)'

  return (
    <>
      {/* Modal de recarga */}
      {showRecarga && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) fecharRecarga() }}>
          <div style={{ background: 'var(--avp-card)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 -4px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Recarregar Créditos</p>
                <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '3px 0 0' }}>Saldo atual: <strong style={{ color: corSaldo }}>{dados.saldo} créditos</strong></p>
              </div>
              <button onClick={fecharRecarga} style={{ background: 'none', border: 'none', color: 'var(--avp-text-dim)', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {!pix ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {dados.pacotes.map(p => (
                    <button key={p.id} onClick={() => setPacoteSelecionado(p)}
                      style={{
                        background: pacoteSelecionado?.id === p.id ? 'rgba(79,70,229,0.15)' : 'var(--avp-black)',
                        border: `2px solid ${pacoteSelecionado?.id === p.id ? '#4f46e5' : 'var(--avp-border)'}`,
                        borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--avp-text)', margin: 0 }}>{p.nome}</p>
                        <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>{p.creditos} créditos</p>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 18, color: '#4f46e5', margin: 0 }}>
                        R$ {Number(p.valor).toFixed(2).replace('.', ',')}
                      </p>
                    </button>
                  ))}
                </div>

                <button onClick={gerarPix} disabled={!pacoteSelecionado || gerandoPix}
                  style={{ width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', cursor: !pacoteSelecionado || gerandoPix ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, opacity: !pacoteSelecionado || gerandoPix ? 0.6 : 1 }}>
                  {gerandoPix ? 'Gerando PIX...' : 'Gerar PIX'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                {pix.qrcodeBase64 && (
                  <img src={pix.qrcodeBase64} alt="QR Code PIX" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', borderRadius: 8 }} />
                )}
                <p style={{ fontSize: 13, color: 'var(--avp-text-dim)', marginBottom: 12 }}>
                  Escaneie o QR Code ou copie o código abaixo
                </p>
                <div style={{ background: 'var(--avp-black)', border: '1px solid var(--avp-border)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, wordBreak: 'break-all' as const }}>
                  <p style={{ fontSize: 11, color: 'var(--avp-text-dim)', fontFamily: 'monospace', margin: 0 }}>{pix.pixCopiaECola.slice(0, 60)}...</p>
                </div>
                <button onClick={copiarPix}
                  style={{ width: '100%', background: copiado ? 'var(--avp-green)' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                  {copiado ? '✓ Código copiado!' : 'Copiar código PIX'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', marginTop: 10 }}>
                  Créditos adicionados automaticamente após o pagamento
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card no dashboard */}
      <div style={{ background: 'var(--avp-card)', border: `1px solid ${saldoBaixo ? (dados.saldo === 0 ? 'rgba(230,57,70,0.3)' : 'rgba(245,158,11,0.3)') : 'var(--avp-border)'}`, borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              🤖
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Assistente IA — {dados.nomeAssistente}</p>
              <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: '2px 0 0' }}>
                Saldo: <strong style={{ color: corSaldo }}>{dados.saldo} crédito{dados.saldo !== 1 ? 's' : ''}</strong>
                {dados.saldo === 0 && ' — Recarregue para continuar usando'}
                {saldoBaixo && dados.saldo > 0 && ' — Saldo baixo'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {wppUrl ? (
              <a href={wppUrl} target="_blank" rel="noreferrer"
                style={{ background: '#25d36620', border: '1px solid #25d36640', color: '#25d366', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
                Abrir Chat
              </a>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--avp-text-dim)', padding: '8px 0', whiteSpace: 'nowrap' as const }}>
                Aguardando configuracao pelo admin
              </span>
            )}
            {dados.pacotes.length > 0 && (
              <button onClick={() => setShowRecarga(true)}
                style={{ background: '#4f46e520', border: '1px solid #4f46e540', color: '#818cf8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                Recarregar
              </button>
            )}
          </div>
        </div>

        {dados.saldo === 0 && dados.pacotes.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--avp-border)' }}>
            <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', margin: 0 }}>
              Sem créditos você não consegue usar o assistente. Use a comparação de cotações, scripts de venda e muito mais!
            </p>
          </div>
        )}
      </div>
    </>
  )
}
