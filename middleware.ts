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
      if (!hasSession(request)) {
        const url = new URL(request.url)
        url.pathname = '/gestor/login'
        return NextResponse.redirect(url)
      }
      const url = new URL(request.url)
      url.pathname = pathname === '/' ? '/gestor' : `/gestor${pathname}`
      return NextResponse.rewrite(url)
    }
  } else if (hostname.startsWith('adm.') && pathname === '/') {
    if (!hasSession(request)) {
      const url = new URL(request.url)
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    const url = new URL(request.url)
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
  } else if (hostname.startsWith('consultor.') && pathname === '/') {
    const url = new URL(request.url)
    url.pathname = '/captacao'
    return NextResponse.rewrite(url)
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
    const url = new URL(request.url)
    if (pathname.startsWith('/aluno'))  { url.pathname = '/consultor/login'; return NextResponse.redirect(url) }
    if (pathname.startsWith('/gestor')) { url.pathname = '/gestor/login';    return NextResponse.redirect(url) }
    if (pathname.startsWith('/admin'))  { url.pathname = '/login';           return NextResponse.redirect(url) }
    if (pathname.startsWith('/super'))  { url.pathname = '/super/login';     return NextResponse.redirect(url) }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
