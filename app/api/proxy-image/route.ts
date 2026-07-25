import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Dominios permitidos para o proxy. Adicione aqui se precisar de mais fontes.
const ALLOWED_HOSTS = new Set([
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co').hostname,
  'i.ytimg.com',
  'img.youtube.com',
  'lh3.googleusercontent.com',
])

// Origem permitida: apenas o próprio domínio da aplicação
function getAllowedOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin') ?? ''
  const host = req.headers.get('host') ?? ''
  // Permite mesma origem ou ausência de origin (request direto do servidor)
  if (!origin || origin.includes(host)) return origin || 'same-origin'
  return 'null'
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('url obrigatória', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('url inválida', { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse('domínio não permitido', { status: 403 })
  }

  const corsOrigin = getAllowedOrigin(req)

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const isSupabase = url.startsWith(supabaseUrl)

    // Tenta sem service role key primeiro (bucket público ou URL assinada)
    const res = await fetch(url, { cache: 'no-store' })

    if (res.ok) {
      const buffer = await res.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': res.headers.get('content-type') || 'image/png',
          'Access-Control-Allow-Origin': corsOrigin,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    }

    // Fallback com service role key apenas para buckets privados do Supabase
    if (isSupabase && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const res2 = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        cache: 'no-store',
      })
      if (!res2.ok) return new NextResponse(`Erro ao buscar imagem: ${res2.status}`, { status: 502 })
      const buf2 = await res2.arrayBuffer()
      return new NextResponse(buf2, {
        headers: {
          'Content-Type': res2.headers.get('content-type') || 'image/png',
          // Cache privado — resposta usa service role key, não pode ser cacheada publicamente
          'Access-Control-Allow-Origin': corsOrigin,
          'Cache-Control': 'private, no-store',
        },
      })
    }

    return new NextResponse(`Erro ao buscar imagem: ${res.status}`, { status: 502 })
  } catch (e) {
    return new NextResponse(`Erro: ${e}`, { status: 500 })
  }
}
