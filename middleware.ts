import { NextResponse, type NextRequest } from 'next/server';

const MAIN_HOST = 'uniavp.autovaleprevencoes.org.br'

const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  consultor: '/captacao',
  gestor:    '/convite/gestor',
  adm:       '/admin',
  admin:     '/admin',
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname

  const sub = host.split('.')[0].toLowerCase()
  const destino = host !== MAIN_HOST ? SUBDOMAIN_REDIRECTS[sub] : null

  if (destino) {
    const url = `https://${MAIN_HOST}${path === '/' ? destino : path}`
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
