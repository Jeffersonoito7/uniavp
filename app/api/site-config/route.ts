import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

import { DOMINIO_MASTER } from '@/lib/constants'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host')?.replace(/:\d+$/, '') ?? ''
  const isDominioMaster = host === DOMINIO_MASTER || host === 'localhost'
  const config = await getSiteConfig(host)
  return NextResponse.json({
    nome: config.nome,
    logoUrl: config.logoPaginaUrl || config.logoMenuUrl || config.logoUrl,
    isDominioMaster,
    dominioCustomizado: config.dominioCustomizado,
  })
}
