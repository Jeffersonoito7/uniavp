import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

function hasOtp(request: NextRequest): boolean {
  return !!request.cookies.get('otp_ok')?.value
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // ── Roteamento por subdomínio ───────────────────────────────────

  // pro.dominio → painel PRO (= /gestor internamente)
  if (hostname.startsWith('pro.') || hostname.startsWith('gestor.')) {
    const excluded =
      pathname.startsWith('/gestor') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/entrar') ||
      pathname.startsWith('/recuperar-senha') ||
      pathname.startsWith('/redefinir-senha') ||
      pathname.startsWith('/convite') ||
      pathname.startsWith('/g/') ||
      pathname.startsWith('/captacao')

    if (!excluded) {
      if (!hasSession(request)) {
        const url = new URL(request.url)
        url.pathname = '/entrar'
        return NextResponse.redirect(url)
      }
      const url = new URL(request.url)
      url.pathname = pathname === '/' ? '/gestor' : `/gestor${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // adm.dominio → painel admin
  else if (hostname.startsWith('adm.') && pathname === '/') {
    if (!hasSession(request)) {
      const url = new URL(request.url)
      url.pathname = '/entrar'
      return NextResponse.redirect(url)
    }
    const url = new URL(request.url)
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
  }

  // free.dominio ou consultor.dominio → página de captação
  else if (hostname.startsWith('free.') || hostname.startsWith('consultor.')) {
    if (pathname === '/') {
      const url = new URL(request.url)
      url.pathname = '/captacao'
      return NextResponse.rewrite(url)
    }
  }

  // ── Proteção de rotas (domínio principal) ───────────────────────
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/entrar') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/consultor/login') ||
    pathname.startsWith('/consultor/otp') ||
    pathname.startsWith('/gestor/login') ||
    pathname.startsWith('/gestor/otp') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/captacao') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/redefinir-senha') ||
    pathname.startsWith('/super/login') ||
    pathname.startsWith('/convite') ||
    pathname.startsWith('/g/') ||
    pathname.startsWith('/planos') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/verificar/') ||
    pathname.startsWith('/upgrade') ||
    pathname.startsWith('/assinar-pro')

  if (isPublic) return NextResponse.next()

  if (!hasSession(request)) {
    const url = new URL(request.url)
    url.pathname = '/entrar'
    return NextResponse.redirect(url)
  }

  // ── Verificação OTP obrigatória ─────────────────────────────────
  // /pro → internamente é /gestor; /free/ → internamente é /aluno/
  if (!hasOtp(request)) {
    const url = new URL(request.url)
    const needsOtp =
      pathname.startsWith('/aluno') ||
      pathname.startsWith('/gestor') ||
      pathname === '/pro' ||
      pathname.startsWith('/pro/') ||
      pathname.startsWith('/free/')
    if (needsOtp) {
      url.pathname = '/entrar/otp'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
