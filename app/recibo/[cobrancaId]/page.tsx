import { createServiceRoleClient } from '@/lib/supabase-server'
import { getSiteConfig } from '@/lib/site-config'

export default async function ReciboPage({ params }: { params: { cobrancaId: string } }) {
  const adminClient = createServiceRoleClient()
  const config = await getSiteConfig()

  const { data: cobranca } = await (adminClient.from('cobrancas') as any)
    .select('*, cliente:clientes(nome, contato_nome, cpf_cnpj)')
    .eq('id', params.cobrancaId)
    .maybeSingle()

  if (!cobranca) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#666' }}>Documento não encontrado.</p>
      </div>
    )
  }

  const pago = cobranca.status === 'pago'
  const valor = Number(cobranca.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const vencimento = cobranca.vencimento
    ? new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : '—'
  const emissao = new Date(cobranca.created_at).toLocaleDateString('pt-BR')
  const nomeCliente = cobranca.cliente?.contato_nome || cobranca.cliente?.nome || '—'
  const docId = params.cobrancaId.slice(0, 8).toUpperCase()

  // QR Code da imagem base64 ou URL do serviço
  const qrCodeSrc = cobranca.qrcode_base64
    ? `data:image/png;base64,${cobranca.qrcode_base64.replace('data:image/png;base64,', '')}`
    : cobranca.pix_copia_cola
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(cobranca.pix_copia_cola)}&color=0D2B6E&bgcolor=ffffff`
      : null

  return (
    <html lang="pt-BR">
      <head>
        <title>{pago ? 'Recibo' : 'Cobrança PIX'} #{docId} — {config.nome}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', Arial, sans-serif; background: #f0f2f5; color: #1a1a2e; }
          @media print {
            body { background: #fff !important; margin: 0 !important; }
            .no-print { display: none !important; }
            .doc { box-shadow: none !important; border: 1px solid #ddd !important; max-width: 100% !important; }
          }
        `}</style>
      </head>
      <body>
        <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 16px 60px' }}>

          {/* Botão imprimir */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ color: '#888', fontSize: 13 }}>
              {pago ? '✅ Recibo de pagamento' : '🔄 Cobrança em aberto'}
            </p>
            <button
              onClick={() => typeof window !== 'undefined' && window.print()}
              style={{ background: '#0D2B6E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              🖨 Imprimir / Salvar PDF
            </button>
          </div>

          <div className="doc" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', overflow: 'hidden' }}>

            {/* ── CABEÇALHO ── */}
            <div style={{ background: '#0D2B6E', padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {config.logoUrl
                  ? <img src={config.logoUrl} alt={config.nome} style={{ height: 44, objectFit: 'contain', display: 'block', marginBottom: 6, filter: 'brightness(0) invert(1)' }} />
                  : <p style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>{config.nome}</p>
                }
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 0.5 }}>
                  {pago ? 'RECIBO DE PAGAMENTO' : 'COBRANÇA VIA PIX'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  background: pago ? '#02A153' : '#1a7fc4',
                  color: '#fff', borderRadius: 8, padding: '8px 18px',
                  fontWeight: 800, fontSize: 15, letterSpacing: 0.5,
                }}>
                  {pago ? '✅ PAGO' : '⏳ AGUARDANDO'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>Nº {docId}</p>
              </div>
            </div>

            {/* ── DADOS + QR CODE ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>

              {/* Dados lado esquerdo */}
              <div style={{ padding: '28px 32px', borderRight: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Dados da cobrança</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Campo label="Beneficiário" value={config.nome} />
                  <Campo label="Pagador" value={nomeCliente} />
                  {cobranca.cliente?.cpf_cnpj && <Campo label="CPF/CNPJ" value={cobranca.cliente.cpf_cnpj} />}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Campo label="Emissão" value={emissao} />
                    <Campo label="Vencimento" value={vencimento} destaque={!pago ? 'azul' : undefined} />
                  </div>
                  <Campo label="Descrição" value={`Mensalidade — ${config.nome}`} />
                </div>

                {/* Valor em destaque */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #f0f0f0' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Valor</p>
                  <p style={{ fontSize: 38, fontWeight: 900, color: '#0D2B6E', letterSpacing: -1 }}>{valor}</p>
                </div>
              </div>

              {/* QR Code lado direito */}
              <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minWidth: 200 }}>
                {!pago && qrCodeSrc ? (
                  <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Pague com PIX</p>
                    <div style={{ padding: 8, border: '3px solid #0D2B6E', borderRadius: 10 }}>
                      <img src={qrCodeSrc} alt="QR Code PIX" width={180} height={180} style={{ display: 'block', borderRadius: 4 }} />
                    </div>
                    <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 1.5 }}>
                      Aponte a câmera<br />do celular para o<br />QR code acima
                    </p>
                  </>
                ) : pago ? (
                  <>
                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#02A15315', border: '3px solid #02A153', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                      ✅
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#02A153', textAlign: 'center' }}>Pagamento<br />confirmado</p>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>QR Code<br />não disponível</p>
                )}
              </div>
            </div>

            {/* ── PIX COPIA E COLA ── */}
            {!pago && cobranca.pix_copia_cola && (
              <div style={{ padding: '16px 32px', background: '#f8faff', borderTop: '1px solid #e8eef8' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#0D2B6E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  PIX Copia e Cola
                </p>
                <div style={{ background: '#fff', border: '1px solid #dce6f5', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace', fontSize: 10, color: '#555', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {cobranca.pix_copia_cola}
                </div>
              </div>
            )}

            {/* ── RODAPÉ ── */}
            <div style={{ background: '#0D2B6E', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                Documento gerado por {config.nome} · Nº {docId}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

function Campo({ label, value, destaque }: { label: string; value: string; destaque?: string }) {
  const cor = destaque === 'azul' ? '#1a7fc4' : destaque === 'verde' ? '#02A153' : '#222'
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: cor }}>{value}</p>
    </div>
  )
}
