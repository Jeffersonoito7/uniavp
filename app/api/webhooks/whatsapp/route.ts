import { NextRequest, NextResponse } from 'next/server'
import { alertarDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function autorizado(req: NextRequest): boolean {
  return req.headers.get('apikey') === process.env.EVOLUTION_API_KEY
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const evento = body?.event
    const instancia: string = body?.instance ?? ''

    if (evento === 'connection.update') {
      const state: string = (body?.data?.state ?? '').toLowerCase()
      if (state === 'close' || state === 'refused') {
        await alertarDiscord(
          'aviso',
          'WhatsApp desconectado',
          `A instância \`${instancia}\` foi desconectada (estado: ${state}).\nAcesse o painel admin → Configurações → Conectar WhatsApp para reconectar.`,
        )
      }
    }
  } catch { /* */ }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ ok: true })
}
