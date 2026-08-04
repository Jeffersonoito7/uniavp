// Motor de cobrança PIX via Efí Pay (antigo Gerencianet)
// Certificado lido de EFI_CERT_BASE64 (base64 do .p12)
import axios from 'axios'
import https from 'https'

const BASE_URL = process.env.EFI_SANDBOX === 'true'
  ? 'https://pix-h.api.efipay.com.br'
  : 'https://pix.api.efipay.com.br'

function getAgent(): https.Agent {
  const b64 = process.env.EFI_CERT_BASE64
  if (!b64) throw new Error('EFI_CERT_BASE64 ausente no .env')
  const pfx = Buffer.from(b64, 'base64')
  const pass = process.env.EFI_CERT_PASSWORD ?? ''
  return new https.Agent({ pfx, passphrase: pass, rejectUnauthorized: false })
}

async function getToken(): Promise<string> {
  const clientId = process.env.EFI_CLIENT_ID
  const clientSecret = process.env.EFI_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('EFI_CLIENT_ID ou EFI_CLIENT_SECRET ausente')
  const { data } = await axios.post(
    `${BASE_URL}/oauth/token`,
    { grant_type: 'client_credentials' },
    {
      httpsAgent: getAgent(),
      auth: { username: clientId, password: clientSecret },
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  )
  return data.access_token
}

export interface CobrancaParams {
  valor: string | number
  descricao: string
  vencimento: string // YYYY-MM-DD
  devedor?: {
    nome: string
    cpf?: string
    cnpj?: string
  }
}

export interface CobrancaResult {
  txid: string
  qrCode: string
  copiaECola: string
  pixKey: string
  locId?: number
}

export async function gerarCobrancaPix(params: CobrancaParams): Promise<CobrancaResult> {
  const chave = process.env.EFI_PIX_KEY
  if (!chave) throw new Error('EFI_PIX_KEY ausente no .env')

  const token = await getToken()
  const agent = getAgent()
  // txid: 26-35 chars, somente [a-zA-Z0-9]
  const rand = Math.random().toString(36).slice(2).toUpperCase().replace(/[^A-Z0-9]/g, '')
  const txid = ('UNI' + Date.now() + rand).slice(0, 35).padEnd(26, '0')
  const valor = Number(params.valor).toFixed(2)

  const doc = params.devedor?.cnpj?.replace(/\D/g, '') || params.devedor?.cpf?.replace(/\D/g, '') || ''
  const temDoc = doc.length === 11 || doc.length === 14
  // cobv exige devedor com CPF/CNPJ valido; sem isso usa cob (imediata)
  const usaCobv = temDoc

  let body: any
  if (usaCobv) {
    body = {
      calendario: { dataDeVencimento: params.vencimento, validadeAposVencimento: 30 },
      valor: {
        original: valor,
        multa: { modalidade: 2, valorPerc: '2.00' },
        juros: { modalidade: 2, valorPerc: '0.03' },
      },
      chave,
      solicitacaoPagador: params.descricao.slice(0, 140),
      devedor: doc.length === 14
        ? { nome: params.devedor!.nome, cnpj: doc }
        : { nome: params.devedor!.nome, cpf: doc },
    }
  } else {
    // cob imediata: expira em 86400s (1 dia) por padrao
    body = {
      calendario: { expiracao: 86400 },
      valor: { original: valor },
      chave,
      solicitacaoPagador: params.descricao.slice(0, 140),
    }
    if (params.devedor?.nome) body.devedor = { nome: params.devedor.nome }
  }

  const endpoint = usaCobv ? `/v2/cobv/${txid}` : `/v2/cob/${txid}`
  await axios.put(`${BASE_URL}${endpoint}`, body, {
    httpsAgent: agent,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    timeout: 20000,
  })

  const { data: cobv } = await axios.get(`${BASE_URL}${endpoint}`, {
    httpsAgent: agent,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  })

  let qrCode = ''
  let copiaECola = ''
  const locId: number | undefined = cobv.loc?.id

  if (locId) {
    const { data: qr } = await axios.get(`${BASE_URL}/v2/loc/${locId}/qrcode`, {
      httpsAgent: agent,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    })
    qrCode = qr.imagemQrcode ?? ''
    copiaECola = qr.qrcode ?? ''
  }

  return { txid, qrCode, copiaECola, pixKey: chave, locId }
}

export async function consultarCobranca(txid: string): Promise<{ status: string; valorPago?: string; pago?: boolean }> {
  const token = await getToken()
  const agent = getAgent()
  const { data } = await axios.get(`${BASE_URL}/v2/cobv/${txid}`, {
    httpsAgent: agent,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  })
  const pago = data.status === 'CONCLUIDA'
  const valorPago = pago && data.pix?.[0]?.valor ? data.pix[0].valor : undefined
  return { status: data.status, valorPago, pago }
}
