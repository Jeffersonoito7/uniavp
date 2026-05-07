import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
  const path = request.nextUrl.pathname;

  const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/cadastro')
    || path.startsWith('/captacao') || path.startsWith('/recuperar-senha') || path.startsWith('/redefinir-senha')
    || path.startsWith('/super/login')
    || path.startsWith('/api/cadastro') || path.startsWith('/_next') || path.startsWith('/favicon')
    || /\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(path);

  if (isPublic) return response;

  if (!user && (path.startsWith('/aluno') || path.startsWith('/admin') || path.startsWith('/gestor'))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && path.startsWith('/super')) {
    return NextResponse.redirect(new URL('/super/login', request.url));
  }

  // verificação de admin feita diretamente na página /admin

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
