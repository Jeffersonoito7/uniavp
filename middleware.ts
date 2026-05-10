import { NextResponse, type NextRequest } from 'next/server';

const MAIN_HOST = 'uniavp.autovaleprevencoes.org.br'

const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  consultor: '/captacao',
  gestor:    '/convite/gestor',
  adm:       '/admin',
  admin:     '/admin',
}

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname

  // ── Subdomínio → redireciona para domínio principal ──────────────
  const sub = host.split('.')[0].toLowerCase()
  const destino = host !== MAIN_HOST ? SUBDOMAIN_REDIRECTS[sub] : null

  if (destino) {
    const url = `https://${MAIN_HOST}${path === '/' ? destino : path}`
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Rotas públicas ───────────────────────────────────────────────
  if (
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/cadastro') ||
    path.startsWith('/captacao') ||
    path.startsWith('/recuperar-senha') ||
    path.startsWith('/redefinir-senha') ||
    path.startsWith('/super/login') ||
    path.startsWith('/convite') ||
    path.startsWith('/g/') ||
    path.startsWith('/planos') ||
    path.startsWith('/api/') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/.test(path)
  ) {
    return NextResponse.next()
  }

  // ── Proteger rotas autenticadas ──────────────────────────────────
  if (!hasSession(request)) {
    if (path.startsWith('/aluno') || path.startsWith('/admin') || path.startsWith('/gestor')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
    if (path.startsWith('/super')) {
      return NextResponse.redirect(new URL('/super/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
