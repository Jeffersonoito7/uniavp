import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const MAIN_HOST = 'uniavp.autovaleprevencoes.org.br'

// Mapa de subdomínio → destino no domínio principal
const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  consultor: '/captacao',
  gestor:    '/convite/gestor',
  adm:       '/admin',
  admin:     '/admin',
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const path = request.nextUrl.pathname

  // ── Detecção de subdomínio ──────────────────────────────────────
  const subdomain = host.split('.')[0].toLowerCase()
  const isSubdomain = host !== MAIN_HOST && SUBDOMAIN_REDIRECTS[subdomain]

  if (isSubdomain) {
    // Subdomínio reconhecido → redireciona para o domínio principal
    const destino = SUBDOMAIN_REDIRECTS[subdomain]
    const url = `https://${MAIN_HOST}${path === '/' ? destino : path}`
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Auth normal (domínio principal) ────────────────────────────
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/cadastro')
    || path.startsWith('/captacao') || path.startsWith('/recuperar-senha') || path.startsWith('/redefinir-senha')
    || path.startsWith('/super/login') || path.startsWith('/convite')
    || path.startsWith('/g/') || path.startsWith('/planos')
    || path.startsWith('/api/cadastro') || path.startsWith('/api/convite')
    || path.startsWith('/_next') || path.startsWith('/favicon')
    || /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/.test(path);

  if (isPublic) return response;

  if (!user && (path.startsWith('/aluno') || path.startsWith('/admin') || path.startsWith('/gestor'))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && path.startsWith('/super')) {
    return NextResponse.redirect(new URL('/super/login', request.url));
  }

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
