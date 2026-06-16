import { NextResponse } from 'next/server'
import https from 'https'
import { URL } from 'url'

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://sandbox.gerencianet.com.br'
  : 'https://api.efipay.com.br'

function reqDebug(url: string, opts: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
  return new Promise((resolve, reject) => {
    const p = new URL(url)
    const bodyBuf = opts.body ? Buffer.from(opts.body, 'utf8') : null
    const headers: Record<string, string | number> = { ...(opts.headers || {}) }
    if (bodyBuf) headers['Content-Length'] = bodyBuf.length
    const r = https.request({
      hostname: p.hostname,
      path: p.pathname + p.search,
      method: opts.method || 'GET',
      headers,
    }, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers as Record<string, string | string[] | undefined>, body: raw }))
    })
    r.on('error', reject)
    if (bodyBuf) r.write(bodyBuf)
    r.end()
  })
}

export async function GET() {
  const creds = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')
  const body = JSON.stringify({ grant_type: 'client_credentials' })

  const authResp = await reqDebug(`${BASE}/v1/authorize`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
    body,
  })

  if (authResp.status !== 200) {
    return NextResponse.json({
      etapa: 'auth',
      status: authResp.status,
      location: authResp.headers['location'],
      body: authResp.body.substring(0, 500),
    })
  }

  let token: string
  try {
    token = JSON.parse(authResp.body).access_token
  } catch {
    return NextResponse.json({ etapa: 'auth_parse', body: authResp.body.substring(0, 500) })
  }

  const planosResp = await reqDebug(`${BASE}/v1/plans`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })

  return NextResponse.json({
    status: planosResp.status,
    planos: planosResp.body.substring(0, 2000),
  })
}
