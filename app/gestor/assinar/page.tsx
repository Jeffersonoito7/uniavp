'use client'
import { useEffect, useState } from 'react'

type Status = {
  status: string
  trialAtivo: boolean
  diasTrial: number
  planoVencimento: string | null
  valorPlano?: number
  ultimoPagamento: { pix_copia_cola: string; qrcode_base64: string; vencimento: string; status: string } | null
}

export default function AssinarPage() {
  const [info, setInfo] = useState<Status | null>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/gestor/assinar').then(r => r.json()).then(setInfo)
  }, [])

  async function gerarPix() {
    setGerando(true); setMsg('')
    const res = await fetch('/api/gestor/assinar', { method: 'POST' })
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
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pag.pix_copia_cola)}&color=0D2B6E&bgcolor=ffffff`
      : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--avp-black)', color: 'var(--avp-text)', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🏢</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>UNIAVP PRO</h1>
          <p style={{ color: 'var(--avp-text-dim)', fontSize: 15 }}>Gerencie sua equipe UNIAVP FREE</p>
        </div>

        {/* Trial ativo */}
        {info?.trialAtivo && (
          <div style={{ background: '#02A15315', border: '1px solid var(--avp-green)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🎁</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--avp-green)', marginBottom: 4 }}>
              {info.diasTrial} {info.diasTrial === 1 ? 'dia restante' : 'dias restantes'} de teste grátis
            </p>
            <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>
              Aproveite ao máximo! Após o trial, o plano é R${(info?.valorPlano ?? 147).toFixed(2).replace('.', ',')}/mês.
            </p>
            <a href="/pro" style={{ display: 'inline-block', marginTop: 16, background: 'var(--avp-green)', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              → Acessar painel
            </a>
          </div>
        )}

        {/* Plano ativo */}
        {info?.status === 'ativo' && (
          <div style={{ background: '#02A15315', border: '1px solid var(--avp-green)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--avp-green)', marginBottom: 4 }}>Plano ativo</p>
            {info.planoVencimento && (
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>
                Válido até {new Date(info.planoVencimento).toLocaleDateString('pt-BR')}
              </p>
            )}
            <a href="/pro" style={{ display: 'inline-block', marginTop: 16, background: 'var(--avp-green)', color: '#fff', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              → Acessar painel
            </a>
          </div>
        )}

        {/* Plano expirado / precisa pagar */}
        {(info?.status === 'suspenso' || info?.status === 'trial' && !info.trialAtivo) && (
          <>
            <div style={{ background: '#e6394615', border: '1px solid var(--avp-danger)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>⚠️</p>
              <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--avp-danger)', marginBottom: 4 }}>
                {info?.status === 'suspenso' ? 'Acesso suspenso' : 'Trial encerrado'}
              </p>
              <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>
                Assine para continuar usando o UNIAVP PRO
              </p>
            </div>

            {/* Card do plano */}
            <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '24px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 20 }}>Plano UNIAVP PRO</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 13 }}>Acesso completo ao painel</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 900, fontSize: 28, color: 'var(--avp-green)' }}>R$ {(info?.valorPlano ?? 147).toFixed(2).replace('.', ',')}</p>
                  <p style={{ color: 'var(--avp-text-dim)', fontSize: 12 }}>/mês</p>
                </div>
              </div>
              {['Painel completo de gestão', 'Cadastro UNIAVP FREE ilimitado', 'Acompanhamento de progresso', 'Geração de artes', 'Relatórios e eventos'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: 'var(--avp-green)', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* PIX */}
            {pag && pag.status === 'pendente' ? (
              <div style={{ background: 'var(--avp-card)', border: '1px solid var(--avp-border)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Pague via PIX</p>
                <p style={{ color: 'var(--avp-text-dim)', fontSize: 13, marginBottom: 20 }}>
                  Vencimento: {pag.vencimento ? new Date(pag.vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                </p>
                {qrSrc && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{ padding: 10, border: '3px solid #0D2B6E', borderRadius: 12, background: '#fff' }}>
                      <img src={qrSrc} width={180} height={180} alt="QR Code PIX" style={{ display: 'block' }} />
                    </div>
                  </div>
                )}
                <button onClick={copiarPix}
                  style={{ width: '100%', background: copiado ? 'var(--avp-green)' : 'var(--avp-blue)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>
                  {copiado ? '✅ PIX copiado!' : '📋 Copiar PIX Copia e Cola'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--avp-text-dim)', lineHeight: 1.5 }}>
                  Após o pagamento, seu acesso é liberado automaticamente em segundos.
                </p>
              </div>
            ) : (
              <button onClick={gerarPix} disabled={gerando}
                style={{ width: '100%', background: 'var(--grad-brand)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 800, fontSize: 16, cursor: gerando ? 'not-allowed' : 'pointer', opacity: gerando ? 0.7 : 1 }}>
                {gerando ? '⏳ Gerando cobrança...' : `💳 Assinar por R$${(info?.valorPlano ?? 147).toFixed(2).replace('.', ',')}/mês`}
              </button>
            )}
            {msg && <p style={{ color: 'var(--avp-danger)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{msg}</p>}
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--avp-text-dim)' }}>
          Dúvidas? Fale conosco no WhatsApp
        </p>
      </div>
    </div>
  )
}
