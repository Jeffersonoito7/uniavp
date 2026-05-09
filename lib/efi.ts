const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br'

async function getToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const data = await res.json()
  return data.access_token
}

export async function criarCobrancaPix(params: {
  txid: string
  valor: number
  vencimento: string // YYYY-MM-DD
  nomeDevedor: string
  cpfCnpj?: string
  descricao?: string
}): Promise<{ pixCopiaECola: string; qrcodeBase64: string; locId: number }> {
  const token = await getToken()

  const payload: Record<string, unknown> = {
    calendario: { dataDeVencimento: params.vencimento, validadeAposVencimento: 30 },
    valor: { original: params.valor.toFixed(2) },
    chave: process.env.EFI_PIX_KEY,
    solicitacaoPagador: params.descricao || 'Mensalidade plataforma',
    devedor: { nome: params.nomeDevedor },
  }
  if (params.cpfCnpj) {
    const digits = params.cpfCnpj.replace(/\D/g, '')
    if (digits.length === 11) (payload.devedor as Record<string, string>).cpf = digits
    else if (digits.length === 14) (payload.devedor as Record<string, string>).cnpj = digits
  }

  const cobRes = await fetch(`${BASE}/v2/cobv/${params.txid}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const cob = await cobRes.json()
  if (!cob.loc?.id) throw new Error(`Erro Efí: ${JSON.stringify(cob)}`)

  const qrRes = await fetch(`${BASE}/v2/loc/${cob.loc.id}/qrcode`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const qr = await qrRes.json()

  return {
    pixCopiaECola: qr.qrcode,
    qrcodeBase64: qr.imagemQrcode,
    locId: cob.loc.id,
  }
}

export async function consultarPagamento(txid: string): Promise<{ status: string; pago: boolean }> {
  const token = await getToken()
  const res = await fetch(`${BASE}/v2/cobv/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return { status: data.status, pago: data.status === 'CONCLUIDA' }
}
