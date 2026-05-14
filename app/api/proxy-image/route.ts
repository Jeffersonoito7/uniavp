import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('url obrigatória', { status: 400 })

  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) return new NextResponse('Erro ao buscar imagem', { status: 502 })

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Erro ao buscar imagem', { status: 500 })
  }
}
