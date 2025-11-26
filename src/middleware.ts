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
  const pathname = request.nextUrl.pathname;

  // 1. Lógica de internacionalização (i18n) - EXECUTA PRIMEIRO
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 2. Definição de rotas protegidas
  // Apenas estas rotas acionarão a verificação do Supabase no servidor (bloqueante)
  const isProtectedRoute = 
    pathname.includes('/admin') || 
    pathname.includes('/profile') ||
    pathname.includes('/schedules') ||
    pathname.includes('/notifications');

  // Se NÃO for rota protegida, retorna imediatamente a resposta do i18n
  // Isso derruba o TTFB de ~1.8s para ~0.1s nas páginas públicas
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 3. Lógica do Supabase (Apenas para rotas protegidas)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Proteção extra: Se tentar acessar admin/perfil sem logar, redireciona
  if (!user && isProtectedRoute) {
    // Pega o locale da URL atual para redirecionar corretamente
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