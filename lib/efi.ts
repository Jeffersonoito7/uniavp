import https from 'https'
import { URL } from 'url'

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br'

function getAgent() {
  const certBase64 = process.env.EFI_CERT_BASE64!.replace(/\s/g, '')
  const pfx = Buffer.from(certBase64, 'base64')
  const passphrase = process.env.EFI_CERT_PASSWORD || undefined
  return new https.Agent({ pfx, passphrase })
}

function httpsRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: getAgent(),
    }
    const req = https.request(reqOptions, res => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode || 0, data: raw }) }
      })
    })
    req.on('error', reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

async function getToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
  ).toString('base64')

  const { data } = await httpsRequest(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const d = data as any
  if (!d.access_token) throw new Error(`Auth Efí falhou: ${JSON.stringify(d)}`)
  return d.access_token
}

export async function criarCobrancaPix(params: {
  txid: string
  valor: number
  vencimento: string
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

  const { data: cob } = await httpsRequest(`${BASE}/v2/cobv/${params.txid}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const c = cob as any
  if (!c.loc?.id) throw new Error(`Erro Efí cobrança: ${JSON.stringify(c)}`)

  const { data: qr } = await httpsRequest(`${BASE}/v2/loc/${c.loc.id}/qrcode`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const q = qr as any

  return { pixCopiaECola: q.qrcode, qrcodeBase64: q.imagemQrcode, locId: c.loc.id }
}

export async function consultarPagamento(txid: string): Promise<{ status: string; pago: boolean }> {
  const token = await getToken()
  const { data } = await httpsRequest(`${BASE}/v2/cobv/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const d = data as any
  return { status: d.status, pago: d.status === 'CONCLUIDA' }
}

export async function registrarWebhook(webhookUrl: string): Promise<void> {
  const token = await getToken()
  const chave = process.env.EFI_PIX_KEY!
  const { status, data } = await httpsRequest(`${BASE}/v2/webhook/${chave}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl }),
  })
  if (status !== 200 && status !== 204) throw new Error(JSON.stringify(data))
}
