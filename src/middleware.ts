import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n/config';
import Negotiator from 'negotiator';

// Função para obter o local correspondente com base nos cabeçalhos da solicitação
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);

  return languages[0] || i18n.defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Verifica se o caminho atual não possui um prefixo de localidade (ex: /pt, /en)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redireciona se não houver localidade no caminho
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);

    // Reconstrói a URL com a localidade detectada
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }
}

// Configura o middleware para ser executado em caminhos específicos
export const config = {
  // O matcher evita que o middleware seja executado em rotas de API, arquivos estáticos, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};