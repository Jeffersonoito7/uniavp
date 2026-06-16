import { NextResponse } from 'next/server'
import https from 'https'
import { URL } from 'url'

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://sandbox.gerencianet.com.br'
  : 'https://api.gerencianet.com.br'

function rawRequest(
  url: string,
  opts: { method?: string; headers?: Record<string, string | number>; body?: Buffer | null },
): Promise<{ status: number; location: string | undefined; body: string }> {
  return new Promise((resolve, reject) => {
    const p = new URL(url)
    const req = https.request({
      hostname: p.hostname,
      port: p.port || 443,
      path: p.pathname + p.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
    }, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => resolve({
        status: res.statusCode || 0,
        location: res.headers['location'],
        body: raw.substring(0, 300),
      }))
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

export async function GET() {
  const creds = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')
  const body = Buffer.from(JSON.stringify({ grant_type: 'client_credentials' }), 'utf8')

  const headers: Record<string, string | number> = {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/json',
    'Content-Length': body.length,
  }

  // Passo 1: requisição inicial sem seguir redirect
  const r1 = await rawRequest(`${BASE}/v1/authorize`, { method: 'POST', headers, body })

  if (r1.status !== 301 && r1.status !== 302 && r1.status !== 307) {
    return NextResponse.json({ passo: 1, status: r1.status, body: r1.body })
  }

  // Passo 2: seguir o redirect (GET para 301/302, POST para 307/308)
  const redirectUrl = r1.location?.startsWith('http')
    ? r1.location
    : `https://${new URL(`${BASE}/v1/authorize`).hostname}${r1.location}`

  const method2 = ([307, 308] as number[]).includes(r1.status) ? 'POST' : 'GET'
  const body2 = method2 === 'POST' ? body : null
  const headers2: Record<string, string | number> = method2 === 'POST'
    ? { ...headers }
    : { 'Authorization': `Basic ${creds}` }
  if (body2) headers2['Content-Length'] = body2.length

  const r2 = await rawRequest(redirectUrl!, { method: method2, headers: headers2, body: body2 })

  return NextResponse.json({
    r1: { status: r1.status, location: r1.location },
    r2: { status: r2.status, location: r2.location, body: r2.body },
    redirectUrl,
    method2,
  })
}
