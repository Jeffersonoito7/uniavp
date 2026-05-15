import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

const DOMINIO_MASTER = 'universidade.oito7digital.com.br'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host')?.replace(/:\d+$/, '') ?? ''
  const isDominioMaster = host === DOMINIO_MASTER || host === 'localhost'
  const config = await getSiteConfig()
  return NextResponse.json({
    nome: config.nome,
    logoUrl: config.logoMenuUrl || config.logoUrl,
    isDominioMaster,
    dominioCustomizado: config.dominioCustomizado,
  })
}
