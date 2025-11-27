import { NextResponse, type NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n/config';
import Negotiator from 'negotiator';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Função para obter o locale com base nos cabeçalhos da solicitação
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);

  return languages[0] || i18n.defaultLocale;
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  
  // Detecta se é uma rota de Web Story para ajustar o layout
  if (request.nextUrl.pathname.includes('/web-stories/')) {
    requestHeaders.set('x-is-amp', 'true');
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 1. Lógica do Supabase - Executa em todas as rotas para manter a sessão atualizada
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // A chamada a getUser() atualiza o token de sessão se necessário
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Lógica de internacionalização (i18n)
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 3. Lógica de rotas protegidas
  const isProtectedRoute = 
    pathname.includes('/admin') || 
    pathname.includes('/profile');

  if (!user && isProtectedRoute) {
    const locale = pathname.split('/')[1] || i18n.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - manifest.json, icon, etc
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|icon-.*\\.svg|sw.js|workbox-.*\\.js).*)',
  ],
};