import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const origin = request.nextUrl.origin

  // ── Roteamento transparente por subdomínio ──────────────────
  if (hostname.startsWith('gestor.')) {
    const excluded =
      pathname.startsWith('/gestor') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/recuperar-senha') ||
      pathname.startsWith('/redefinir-senha') ||
      pathname.startsWith('/convite') ||
      pathname.startsWith('/g/') ||
      pathname.startsWith('/captacao')

    if (!excluded) {
      const dest = pathname === '/' ? '/gestor' : `/gestor${pathname}`

      // sem sessão → login
      if (!hasSession(request)) {
        return NextResponse.redirect(new URL('/gestor/login', origin))
      }
      return NextResponse.rewrite(new URL(dest, origin))
    }
  } else if (hostname.startsWith('adm.') && pathname === '/') {
    if (!hasSession(request)) {
      return NextResponse.redirect(new URL('/login', origin))
    }
    return NextResponse.rewrite(new URL('/admin', origin))
  } else if (hostname.startsWith('consultor.') && pathname === '/') {
    return NextResponse.rewrite(new URL('/captacao', origin))
  }

  // ── Proteção de rotas (domínio principal) ───────────────────
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/consultor/login') ||
    pathname.startsWith('/gestor/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/captacao') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/redefinir-senha') ||
    pathname.startsWith('/super/login') ||
    pathname.startsWith('/convite') ||
    pathname.startsWith('/g/') ||
    pathname.startsWith('/planos') ||
    pathname.startsWith('/api/')

  if (isPublic) return NextResponse.next()

  if (!hasSession(request)) {
    if (pathname.startsWith('/aluno'))  return NextResponse.redirect(new URL('/consultor/login', origin))
    if (pathname.startsWith('/gestor')) return NextResponse.redirect(new URL('/gestor/login', origin))
    if (pathname.startsWith('/admin'))  return NextResponse.redirect(new URL('/login', origin))
    if (pathname.startsWith('/super'))  return NextResponse.redirect(new URL('/super/login', origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
