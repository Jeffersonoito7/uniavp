import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_PROJECT_REF = 'chntghqjogoqdhyuargf'

function hasSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(c =>
    c.name.startsWith(`sb-${SUPABASE_PROJECT_REF}-auth-token`)
  )
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isPublic =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/consultor/login') ||
    path.startsWith('/gestor/login') ||
    path.startsWith('/cadastro') ||
    path.startsWith('/captacao') ||
    path.startsWith('/recuperar-senha') ||
    path.startsWith('/redefinir-senha') ||
    path.startsWith('/super/login') ||
    path.startsWith('/convite') ||
    path.startsWith('/g/') ||
    path.startsWith('/planos') ||
    path.startsWith('/api/')

  if (isPublic) return NextResponse.next()

  if (!hasSession(request)) {
    if (path.startsWith('/aluno')) {
      return NextResponse.redirect(new URL('/consultor/login', request.url))
    }
    if (path.startsWith('/gestor') && !path.startsWith('/gestor/login')) {
      return NextResponse.redirect(new URL('/gestor/login', request.url))
    }
    if (path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (path.startsWith('/super')) {
      return NextResponse.redirect(new URL('/super/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/aluno/:path*',
    '/admin/:path*',
    '/gestor/:path*',
    '/super/:path*',
    '/consultor/:path*',
  ]
}
