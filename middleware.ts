import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

// Rate limiting em memória por instância edge (proteção básica contra abuso)
// Chave: `${ip}:${endpoint}` → [contagem, timestamp janela]
const RL_STORE = new Map<string, [number, number]>()
const RL_RULES: { match: (p: string, m: string) => boolean; max: number; windowMs: number }[] = [
  // Assinar PRO: máx 10 tentativas por IP em 10 minutos
  { match: (p, m) => p === '/api/consultor/assinar-pro' && m === 'POST', max: 10, windowMs: 10 * 60_000 },
  // OTP WhatsApp: máx 5 por IP em 5 minutos
  { match: (p, m) => (p.includes('/otp') || p.includes('/verificar-otp')) && m === 'POST', max: 5, windowMs: 5 * 60_000 },
  // Webhooks externos: máx 200 por minuto (proteção contra flood)
  { match: (p) => p.startsWith('/api/webhooks/'), max: 200, windowMs: 60_000 },
]

function checkRateLimit(ip: string, pathname: string, method: string): { blocked: boolean; retryAfter?: number } {
  const now = Date.now()
  for (const rule of RL_RULES) {
    if (!rule.match(pathname, method)) continue
    const key = `${ip}:${pathname}`
    const entry = RL_STORE.get(key)
    if (!entry || now - entry[1] > rule.windowMs) {
      RL_STORE.set(key, [1, now])
      return { blocked: false }
    }
    if (entry[0] >= rule.max) {
      const retryAfter = Math.ceil((rule.windowMs - (now - entry[1])) / 1000)
      return { blocked: true, retryAfter }
    }
    entry[0]++
    return { blocked: false }
  }
  return { blocked: false }
}

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const method = request.method

  // Bloqueia arquivos sensiveis: .env, .git, .htaccess, source maps
  if (pathname.startsWith('/.') || pathname.endsWith('.map')) {
    return new NextResponse(null, { status: 404 })
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(ip, pathname, method)
  if (rl.blocked) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rl.retryAfter ?? 60),
      },
    })
  }

  // ── Roteamento por subdomínio ───────────────────────────────────

  // adm.dominio → painel admin
  if (hostname.startsWith('adm.') && pathname === '/') {
    if (!hasSession(request)) {
      const url = new URL(request.url)
      url.pathname = '/entrar'
      return NextResponse.redirect(url)
    }
    const url = new URL(request.url)
    url.pathname = '/admin'
    return NextResponse.rewrite(url)
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
    pathname.startsWith('/c/') ||
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
