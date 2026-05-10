import { NextResponse } from 'next/server'
import { getSiteConfig } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json({
    nome: config.nome,
    logoUrl: config.logoMenuUrl || config.logoUrl,
    isDominioMaster: config.isDominioMaster,
  })
}
