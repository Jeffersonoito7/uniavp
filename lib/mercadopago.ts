/**
 * Integração Mercado Pago — PIX para gestores/consultores PRO.
 * Substitui a Efi para geração e consulta de PIX na Universidade (Vercel).
 * A Efi continua sendo usada para boletos e cartão.
 */

const MP_BASE = 'https://api.mercadopago.com'

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado')
  return token
}

export function isMpPaymentId(txid: string): boolean {
  // MP payment IDs são strings numéricas (ex: "12345678901")
  // Efi txids são hex (ex: "edddeee24fc441f0bbb8662b8804ca84")
  return /^\d+$/.test(txid)
}

export async function criarCobrancaPixMP(params: {
  valor: number
  descricao: string
  nomeDevedor: string
  emailDevedor: string
  vencimentoDias?: number
}): Promise<{ paymentId: string; pixCopiaECola: string; qrcodeBase64: string }> {
  const { valor, descricao, nomeDevedor, emailDevedor, vencimentoDias = 3 } = params

  const dataExpiracao = new Date(Date.now() + vencimentoDias * 24 * 60 * 60 * 1000)
  // MP exige fuso horário explícito: -03:00 (Brasília)
  const iso = dataExpiracao.toISOString().replace('Z', '-03:00')

  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      transaction_amount: valor,
      payment_method_id: 'pix',
      description: descricao,
      date_of_expiration: iso,
      payer: {
        email: emailDevedor,
        first_name: nomeDevedor.split(' ')[0],
        last_name: nomeDevedor.split(' ').slice(1).join(' ') || nomeDevedor.split(' ')[0],
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`MP criarPagamento ${res.status}: ${JSON.stringify(data)}`)
  }

  const td = data?.point_of_interaction?.transaction_data
  if (!td?.qr_code) {
    throw new Error(`MP: qr_code ausente na resposta: ${JSON.stringify(data)}`)
  }

  return {
    paymentId: String(data.id),
    pixCopiaECola: td.qr_code as string,
    qrcodeBase64: (td.qr_code_base64 as string) ?? '',
  }
}

export async function consultarPagamentoMP(paymentId: string): Promise<{ status: string; pago: boolean }> {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`MP consultarPagamento ${res.status}: ${body}`)
  }
  const data = await res.json()
  const status = String(data?.status ?? 'unknown')
  return { status, pago: status === 'approved' }
}
