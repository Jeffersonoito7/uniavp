import { NextResponse } from 'next/server'
import https from 'https'
import { URL } from 'url'

function rawPost(url: string, clientId: string, clientSecret: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const cred = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const body = Buffer.from('{"grant_type":"client_credentials"}', 'utf8')
    const p = new URL(url)
    const req = https.request({
      hostname: p.hostname,
      path: p.pathname,
      method: 'POST',
      headers: {
        Authorization: `Basic ${cred}`,
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
      timeout: 15000,
    }, res => {
      let raw = ''
      res.on('data', c => { raw += c })
      res.on('end', () => resolve({ status: res.statusCode || 0, body: raw.substring(0, 500) }))
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

export async function GET() {
  const clientId = process.env.EFI_CLIENT_ID ?? ''
  const clientSecret = process.env.EFI_CLIENT_SECRET ?? ''
  const sandbox = process.env.EFI_SANDBOX

  const diagnostico = {
    sandbox,
    clientIdPrefix: clientId.substring(0, 20) + '...',
    clientSecretPrefix: clientSecret.substring(0, 15) + '...',
  }

  // Testa direto nos dois ambientes independente do EFI_SANDBOX
  const [prod, sand] = await Promise.all([
    rawPost('https://api.gerencianet.com.br/v1/authorize', clientId, clientSecret).catch(e => ({ status: 0, body: e.message })),
    rawPost('https://sandbox.gerencianet.com.br/v1/authorize', clientId, clientSecret).catch(e => ({ status: 0, body: e.message })),
  ])

  return NextResponse.json({ diagnostico, prod, sandbox: sand })
}
