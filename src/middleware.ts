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

  // 1. Lógica de internacionalização (i18n) - EXECUTA PRIMEIRO (Rápido)
  // Verifica se o caminho atual não possui um prefixo de localidade
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Se faltar o locale, redireciona imediatamente. 
  // NÃO carregamos o Supabase aqui para economizar tempo de processamento (TTFB).
  // O Supabase rodará na próxima requisição (para a URL redirecionada).
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // 2. Lógica do Supabase (Auth) - Só roda se a URL já estiver correta
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

  // Atualiza a sessão do usuário
  await supabase.auth.getSession();

  return response;
}

// Executa em todas as rotas, exceto estáticas/api
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};