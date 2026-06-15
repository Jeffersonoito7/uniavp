import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get('size') ?? 512)

  const admin = createServiceRoleClient()
  const { data } = await admin.from('configuracoes')
    .select('chave, valor')
    .in('chave', ['site_nome', 'site_cor_primaria'])

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    const s = String(row.valor ?? '')
    try { map[row.chave] = JSON.parse(s) } catch { map[row.chave] = s }
  }

  const nome = map['site_nome'] || 'UNIAVP'
  const cor = map['site_cor_primaria'] || '#02A153'

  // Abreviação: primeiras 3 letras da 1ª palavra + palavras seguintes (máx 6 chars)
  const palavras = nome.split(' ').filter((w: string) => w.length > 0)
  const abrev = nome.length <= 6
    ? nome
    : (palavras[0].slice(0, 3).toUpperCase() + palavras.slice(1).join('')).slice(0, 6)

  // Tamanho da fonte relativo ao ícone
  const fontSize = abrev.length <= 4 ? size * 0.38 : abrev.length <= 6 ? size * 0.28 : size * 0.22
  const r = size * 0.18 // border-radius do quadrado

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${cor}"/>
  <text
    x="${size / 2}"
    y="${size / 2 + fontSize * 0.36}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="#ffffff"
    text-anchor="middle"
    letter-spacing="-1"
  >${abrev}</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
