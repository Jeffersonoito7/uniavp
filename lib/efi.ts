import https from 'https'
import { URL } from 'url'

// ── Tipos das respostas da API Efí ────────────────────────────────────────
type EfiTokenResponse   = { access_token: string; token_type: string; expires_in: number }
type EfiCobrancaLoc     = { id: number; location: string; tipoCob: string }
type EfiCobrancaResponse= { loc: EfiCobrancaLoc; status: string; txid: string }
type EfiQrcodeResponse  = { qrcode: string; imagemQrcode: string }
type EfiStatusResponse  = { status: string }
type EfiBoletoToken     = { access_token: string }
type EfiChargeResponse  = { data: { charge_id: number } }
type EfiBilletResponse  = { data: { barcode: string; pdf: { charge: string }; expire_at: string } }
type EfiConsultaResponse= { data: { status: string } }

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br'

// Base separada para boleto (API de cobranças — não usa certificado)
const BASE_BOLETO = process.env.EFI_SANDBOX === 'true'
  ? 'https://sandbox.gerencianet.com.br'
  : 'https://api.efipay.com.br'

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
  const d = data as EfiTokenResponse
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

  const devedor: Record<string, string> = { nome: params.nomeDevedor }
  if (params.cpfCnpj) {
    const digits = params.cpfCnpj.replace(/\D/g, '')
    if (digits.length === 11) devedor.cpf = digits
    else if (digits.length === 14) devedor.cnpj = digits
  }

  // cobv (com vencimento) exige devedor com CPF/CNPJ — se não tiver, usa cob simples
  const temDevedor = !!(devedor.cpf || devedor.cnpj)

  let c: EfiCobrancaResponse
  if (temDevedor) {
    // Cobrança com vencimento (cobv)
    const payload: Record<string, unknown> = {
      calendario: { dataDeVencimento: params.vencimento, validadeAposVencimento: 30 },
      devedor,
      valor: { original: params.valor.toFixed(2) },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: params.descricao || 'Mensalidade plataforma',
    }
    const { data } = await httpsRequest(`${BASE}/v2/cobv/${params.txid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    c = data as EfiCobrancaResponse
  } else {
    // Cobrança simples sem vencimento (cob) — expira em 3 dias
    const payload: Record<string, unknown> = {
      calendario: { expiracao: 259200 },
      valor: { original: params.valor.toFixed(2) },
      chave: process.env.EFI_PIX_KEY,
      solicitacaoPagador: params.descricao || 'Mensalidade plataforma',
    }
    const { data } = await httpsRequest(`${BASE}/v2/cob/${params.txid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    c = data as EfiCobrancaResponse
  }

  if (!c.loc?.id) throw new Error(`Erro Efí cobrança: ${JSON.stringify(c)}`)

  const { data: qr } = await httpsRequest(`${BASE}/v2/loc/${c.loc.id}/qrcode`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const q = qr as EfiQrcodeResponse

  return { pixCopiaECola: q.qrcode, qrcodeBase64: q.imagemQrcode, locId: c.loc.id }
}

export async function consultarPagamento(txid: string): Promise<{ status: string; pago: boolean }> {
  const token = await getToken()
  // Tenta cobv (com vencimento) primeiro; se não achar, tenta cob (simples, sem CPF/CNPJ)
  const { data: dataCobv } = await httpsRequest(`${BASE}/v2/cobv/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const cobv = dataCobv as EfiStatusResponse
  if (cobv.status) return { status: cobv.status, pago: cobv.status === 'CONCLUIDA' }

  const { data: dataCob } = await httpsRequest(`${BASE}/v2/cob/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const cob = dataCob as EfiStatusResponse
  return { status: cob.status ?? 'DESCONHECIDO', pago: cob.status === 'CONCLUIDA' }
}

// ── BOLETO ────────────────────────────────────────────────────────────────

async function getTokenBoleto(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
  ).toString('base64')
  const { data } = await httpsRequestSimples(`${BASE_BOLETO}/v1/authorize`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  })
  const d = data as EfiBoletoToken
  if (!d.access_token) throw new Error(`Auth Efí boleto falhou: ${JSON.stringify(d)}`)
  return d.access_token
}

// Requisição simples (sem certificado — para API de boleto)
function httpsRequestSimples(url: string, options: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
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

export async function criarBoleto(params: {
  valor: number
  vencimento: string      // YYYY-MM-DD
  nomeCliente: string
  cpfCnpj: string
  email?: string
  telefone?: string
  mensagem?: string       // aparece no boleto
  instrucoes?: string[]   // instruções ao caixa (max 4)
  multa?: number          // % multa por atraso (ex: 2)
  juros?: number          // % juros ao mês (ex: 1)
  descricao?: string
}): Promise<{
  chargeId: number
  codigoBarras: string
  pdfUrl: string
  vencimento: string
}> {
  const token = await getTokenBoleto()

  // 1. Cria cobrança
  const { data: charge } = await httpsRequestSimples(`${BASE_BOLETO}/v1/charge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        name: params.descricao || 'Mensalidade plataforma',
        value: Math.round(params.valor * 100), // em centavos
        amount: 1,
      }],
    }),
  })
  const c = charge as EfiChargeResponse
  if (!c.data?.charge_id) throw new Error(`Erro ao criar cobrança Efí: ${JSON.stringify(c)}`)
  const chargeId = c.data.charge_id

  // 2. Emite boleto
  const digits = params.cpfCnpj.replace(/\D/g, '')
  const customer: Record<string, string> = { name: params.nomeCliente }
  if (digits.length === 11) customer.cpf = digits
  else if (digits.length === 14) customer.juridical_person = JSON.stringify({ corporate_name: params.nomeCliente, cnpj: digits })
  if (params.email) customer.email = params.email
  if (params.telefone) customer.phone_number = params.telefone.replace(/\D/g, '')

  const billet: Record<string, unknown> = {
    expire_at: params.vencimento,
    customer,
  }
  if (params.mensagem) billet.message = params.mensagem
  if (params.instrucoes?.length) billet.instructions = params.instrucoes.slice(0, 4)
  if (params.multa) billet.configurations = { ...((billet.configurations as object) || {}), fine: Math.round(params.multa * 100) }
  if (params.juros) billet.configurations = { ...((billet.configurations as object) || {}), interest: Math.round(params.juros * 100) }

  const { data: bil } = await httpsRequestSimples(`${BASE_BOLETO}/v1/charge/${chargeId}/billet`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(billet),
  })
  const b = bil as EfiBilletResponse
  if (!b.data?.barcode) throw new Error(`Erro ao emitir boleto Efí: ${JSON.stringify(b)}`)

  return {
    chargeId,
    codigoBarras: b.data.barcode,
    pdfUrl: b.data.pdf?.charge || '',
    vencimento: params.vencimento,
  }
}

// ── LINK DE PAGAMENTO CARTÃO ANUAL ────────────────────────────────────────

type EfiLinkResponse = { data?: { payment_url?: string; link?: string; charge_id?: number } }
type EfiNotifResponse = { data?: Array<{ status?: { current?: string }; identifiers?: { charge_id?: number }; value?: number }> }
type EfiChargeGetResponse = { data?: { status?: string; charge_id?: number } }

export async function criarLinkCartaoAnual(params: {
  valor: number
  descricao?: string
  notificationUrl: string
}): Promise<{ paymentUrl: string; chargeId: number }> {
  const token = await getTokenBoleto()

  // 1. Cria a cobrança com notification_url
  const { data: charge } = await httpsRequestSimples(`${BASE_BOLETO}/v1/charge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        name: params.descricao || 'Assinatura Anual PRO',
        value: Math.round(params.valor * 100),
        amount: 1,
      }],
      notification_url: params.notificationUrl,
    }),
  })
  const c = charge as EfiChargeResponse
  if (!c.data?.charge_id) throw new Error(`Efí charge: ${JSON.stringify(c)}`)
  const chargeId = c.data.charge_id

  // 2. Gera link de pagamento (Efí hospeda a página do cartão)
  const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: link } = await httpsRequestSimples(`${BASE_BOLETO}/v1/charge/${chargeId}/link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payment_method: 'credit_card',
      expire_at: expire,
    }),
  })
  const l = link as EfiLinkResponse
  const paymentUrl = l.data?.payment_url || l.data?.link || ''
  if (!paymentUrl) throw new Error(`Efí link: ${JSON.stringify(link)}`)

  return { paymentUrl, chargeId }
}

export async function consultarNotificacaoCartao(notificationToken: string): Promise<{ chargeId: number | null; pago: boolean }> {
  const token = await getTokenBoleto()
  const { data } = await httpsRequestSimples(`${BASE_BOLETO}/v1/notification/${notificationToken}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const n = data as EfiNotifResponse
  const item = n.data?.[0]
  const chargeId = item?.identifiers?.charge_id ?? null
  const pago = item?.status?.current === 'paid'
  return { chargeId, pago }
}

export async function consultarStatusCharge(chargeId: number): Promise<{ pago: boolean }> {
  const token = await getTokenBoleto()
  const { data } = await httpsRequestSimples(`${BASE_BOLETO}/v1/charge/${chargeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const d = data as EfiChargeGetResponse
  return { pago: d.data?.status === 'paid' }
}

export async function consultarWebhook(): Promise<{ webhookUrl?: string; registrado: boolean; erro?: string }> {
  try {
    const token = await getToken()
    const chave = process.env.EFI_PIX_KEY!
    const { status, data } = await httpsRequest(`${BASE}/v2/webhook/${chave}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const d = data as { webhookUrl?: string }
    if (status === 200 && d.webhookUrl) return { webhookUrl: d.webhookUrl, registrado: true }
    return { registrado: false }
  } catch (e: any) {
    return { registrado: false, erro: e.message }
  }
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
