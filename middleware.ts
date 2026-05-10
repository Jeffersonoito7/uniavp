import { NextResponse, type NextRequest } from 'next/server';

const MAIN_HOST = 'uniavp.autovaleprevencoes.org.br'

const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  consultor: '/captacao',
  gestor:    '/convite/gestor',
  adm:       '/admin',
  admin:     '/admin',
}

// Project ref extraído da SUPABASE_URL para identificar o cookie de sessão
const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function getSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  // Supabase armazena sessão em sb-{project-ref}-auth-token ou sb-{ref}-auth-token.0
  return cookies.some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname

  // ── Detecção de subdomínio ──────────────────────────────────────
  const subdomain = host.split('.')[0].toLowerCase()
  const isSubdomain = host !== MAIN_HOST && SUBDOMAIN_REDIRECTS[subdomain]

  if (isSubdomain) {
    const destino = SUBDOMAIN_REDIRECTS[subdomain as string]
    const url = `https://${MAIN_HOST}${path === '/' ? destino : path}`
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Auth (domínio principal) ────────────────────────────────────
  const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/cadastro')
    || path.startsWith('/captacao') || path.startsWith('/recuperar-senha') || path.startsWith('/redefinir-senha')
    || path.startsWith('/super/login') || path.startsWith('/convite')
    || path.startsWith('/g/') || path.startsWith('/planos')
    || path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/favicon')
    || /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/.test(path);

  if (isPublic) return NextResponse.next()

  const hasSession = getSessionCookie(request)

  if (!hasSession && (path.startsWith('/aluno') || path.startsWith('/admin') || path.startsWith('/gestor'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  if (!hasSession && path.startsWith('/super')) {
    return NextResponse.redirect(new URL('/super/login', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
