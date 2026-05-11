import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const hostname = request.headers.get('host') || ''

  // Transparent hostname routing — URL stays on the subdomain, no redirect
  let effectivePath = path
  let shouldRewrite = false

  if (hostname.startsWith('gestor.')) {
    // gestor.autovaleprevencoes.org.br — serve /gestor/* transparently
    // Exceções: rotas públicas raiz que devem ser servidas sem prefixo
    const gestorExcluded =
      path.startsWith('/gestor') ||
      path.startsWith('/api/') ||
      path.startsWith('/_next/') ||
      path.startsWith('/recuperar-senha') ||
      path.startsWith('/redefinir-senha') ||
      path.startsWith('/convite') ||
      path.startsWith('/g/') ||
      path.startsWith('/captacao')
    if (!gestorExcluded) {
      effectivePath = path === '/' ? '/gestor' : `/gestor${path}`
      shouldRewrite = true
    }
  } else if (hostname.startsWith('adm.')) {
    // adm.autovaleprevencoes.org.br — serve /admin transparently at root
    if (path === '/') {
      effectivePath = '/admin'
      shouldRewrite = true
    }
    // /admin/* and /login already work; let them pass through
  } else if (hostname.startsWith('consultor.')) {
    // consultor.autovaleprevencoes.org.br — / goes to captacao landing
    if (path === '/') {
      effectivePath = '/captacao'
      shouldRewrite = true
    }
  }

  const isPublic =
    effectivePath === '/' ||
    effectivePath.startsWith('/login') ||
    effectivePath.startsWith('/consultor/login') ||
    effectivePath.startsWith('/gestor/login') ||
    effectivePath.startsWith('/cadastro') ||
    effectivePath.startsWith('/captacao') ||
    effectivePath.startsWith('/recuperar-senha') ||
    effectivePath.startsWith('/redefinir-senha') ||
    effectivePath.startsWith('/super/login') ||
    effectivePath.startsWith('/convite') ||
    effectivePath.startsWith('/g/') ||
    effectivePath.startsWith('/planos') ||
    effectivePath.startsWith('/api/')

  if (isPublic) {
    if (shouldRewrite) {
      const url = request.nextUrl.clone()
      url.pathname = effectivePath
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  if (!hasSession(request)) {
    const url = request.nextUrl.clone()
    if (effectivePath.startsWith('/aluno')) {
      url.pathname = '/consultor/login'
      return NextResponse.redirect(url)
    }
    if (effectivePath.startsWith('/gestor')) {
      url.pathname = '/gestor/login'
      return NextResponse.redirect(url)
    }
    if (effectivePath.startsWith('/admin')) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (effectivePath.startsWith('/super')) {
      url.pathname = '/super/login'
      return NextResponse.redirect(url)
    }
  }

  if (shouldRewrite) {
    const url = request.nextUrl.clone()
    url.pathname = effectivePath
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
