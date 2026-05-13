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
        <p style={{ color: '#666' }}>Recibo não encontrado.</p>
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

  return (
    <html>
      <head>
        <title>Recibo #{params.cobrancaId.slice(0, 8).toUpperCase()}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', Arial, sans-serif; background: #f5f5f5; }
          @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            .card { box-shadow: none !important; border: 1px solid #ddd !important; }
          }
        `}</style>
      </head>
      <body>
        <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 16px 60px' }}>

          {/* Botão imprimir */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => typeof window !== 'undefined' && window.print()}
              style={{ background: '#1a7a50', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              🖨 Imprimir / Salvar PDF
            </button>
          </div>

          <div className="card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

            {/* Cabeçalho */}
            <div style={{ background: '#0D2B6E', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {config.logoUrl
                  ? <img src={config.logoUrl} alt={config.nome} style={{ height: 40, objectFit: 'contain', marginBottom: 6, display: 'block' }} />
                  : <p style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{config.nome}</p>
                }
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Documento fiscal de pagamento</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: pago ? '#02A153' : '#f59e0b', color: '#fff', borderRadius: 6, padding: '6px 16px', fontWeight: 800, fontSize: 14 }}>
                  {pago ? '✅ PAGO' : '⏳ PENDENTE'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 6 }}>Nº {params.cobrancaId.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {/* Título */}
            <div style={{ background: '#0A7A42', padding: '12px 32px' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
                {pago ? 'RECIBO DE PAGAMENTO' : 'BOLETO / FATURA'}
              </p>
            </div>

            {/* Dados */}
            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', marginBottom: 24 }}>
                <Campo label="Cliente" value={nomeCliente} />
                <Campo label="CPF/CNPJ" value={cobranca.cliente?.cpf_cnpj || '—'} />
                <Campo label="Emissão" value={emissao} />
                <Campo label="Vencimento" value={vencimento} />
                <Campo label="Tipo" value={cobranca.tipo === 'boleto' ? 'Boleto Bancário' : 'PIX'} />
                <Campo label="Status" value={pago ? 'Pago' : 'Aguardando pagamento'} destaque={pago ? 'verde' : 'amarelo'} />
              </div>

              {/* Descrição */}
              <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '14px 18px', marginBottom: 24, borderLeft: '3px solid #0D2B6E' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Descrição</p>
                <p style={{ fontSize: 14, color: '#333' }}>Mensalidade — {config.nome}</p>
              </div>

              {/* Valor */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #eee', paddingTop: 20 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>VALOR TOTAL</p>
                  <p style={{ fontSize: 36, fontWeight: 900, color: '#0D2B6E' }}>{valor}</p>
                </div>
              </div>
            </div>

            {/* Código de barras */}
            {cobranca.codigo_barras && (
              <div style={{ padding: '16px 32px', borderTop: '1px solid #eee', background: '#fafafa' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Código de Barras</p>
                <p style={{ fontSize: 13, fontFamily: 'monospace', color: '#333', wordBreak: 'break-all', letterSpacing: 1 }}>{cobranca.codigo_barras}</p>
                {cobranca.pdf_url && (
                  <a href={cobranca.pdf_url} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 10, background: '#0D2B6E', color: '#fff', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    📄 Baixar boleto PDF
                  </a>
                )}
              </div>
            )}

            {/* Rodapé */}
            <div style={{ background: '#0D2B6E', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Documento gerado por {config.nome}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Emitido em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

function Campo({ label, value, destaque }: { label: string; value: string; destaque?: 'verde' | 'amarelo' }) {
  const cor = destaque === 'verde' ? '#0A7A42' : destaque === 'amarelo' ? '#d97706' : '#222'
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: cor }}>{value}</p>
    </div>
  )
}
