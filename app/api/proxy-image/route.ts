import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('url obrigatória', { status: 400 })

  try {
    // Tenta buscar com o service role key se for URL do Supabase
    const headers: Record<string, string> = {}
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (url.includes(supabaseUrl) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      headers['apikey'] = process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) {
      // Tenta sem headers como fallback
      const res2 = await fetch(url, { cache: 'no-store' })
      if (!res2.ok) return new NextResponse(`Erro ao buscar imagem: ${res2.status}`, { status: 502 })
      const buf2 = await res2.arrayBuffer()
      return new NextResponse(buf2, {
        headers: {
          'Content-Type': res2.headers.get('content-type') || 'image/png',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return new NextResponse(`Erro: ${e}`, { status: 500 })
  }
}
