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
  // Cria uma resposta inicial. Isso permite que a lógica do Supabase
  // modifique os cookies da resposta se necessário.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Cria um cliente Supabase para o middleware.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Se um cookie for definido, atualize os cookies na requisição e na resposta.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Se um cookie for removido, atualize os cookies na requisição e na resposta.
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

  // Atualiza a sessão do usuário. Isso é crucial para Server Components.
  await supabase.auth.getSession();

  // Lógica de internacionalização (i18n)
  const pathname = request.nextUrl.pathname;

  // Verifica se o caminho atual não possui um prefixo de localidade
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redireciona para o locale detectado se não houver localidade no caminho
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    // Retorna um novo objeto de redirecionamento.
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Se nenhuma outra ação for tomada, retorna a resposta (possivelmente com cookies atualizados).
  return response;
}

// Executa em todas as rotas — o próprio middleware ignora as internas/estáticas acima
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas de requisição, exceto as que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * Isso evita que o middleware seja executado em requisições desnecessárias.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};