import { NextResponse } from 'next/server'

const BASE = process.env.EFI_SANDBOX === 'true'
  ? 'https://sandbox.gerencianet.com.br'
  : 'https://api.efipay.com.br'

import https from 'https'
import { URL } from 'url'

function req(url: string, opts: { method?: string; headers?: Record<string, string>; body?: string }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const p = new URL(url)
    const r = https.request({ hostname: p.hostname, path: p.pathname + p.search, method: opts.method || 'GET', headers: opts.headers || {} }, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => { try { resolve(JSON.parse(raw)) } catch { resolve(raw) } })
    })
    r.on('error', reject)
    if (opts.body) r.write(opts.body)
    r.end()
  })
}

export async function GET() {
  const creds = Buffer.from(`${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`).toString('base64')
  const auth = await req(`${BASE}/v1/authorize`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  }) as any

  const token = auth?.access_token
  if (!token) return NextResponse.json({ erro: 'auth falhou', detalhe: auth })

  const planos = await req(`${BASE}/v1/plans`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return NextResponse.json({ planos })
}
