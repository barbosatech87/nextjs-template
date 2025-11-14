import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n/config';
import Negotiator from 'negotiator';

// Função para obter o locale com base nos cabeçalhos da solicitação
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);

  return languages[0] || i18n.defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Importante: só processar navegações GET.
  // Server Actions e uploads usam POST/PUT/PATCH/DELETE e não devem passar por lógica de redirecionamento.
  if (request.method !== 'GET') {
    return NextResponse.next();
  }

  // Ignora rotas internas do Next, API e arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/_next/') ||
    pathname.startsWith('/__next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.[^/]+$/.test(pathname) // qualquer arquivo com extensão
  ) {
    return NextResponse.next();
  }

  // Verifica se o caminho atual não possui um prefixo de localidade (ex: /pt, /en)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redireciona para o locale detectado se não houver localidade no caminho
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    const newPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

// Executa em todas as rotas — o próprio middleware ignora as internas/estáticas acima
export const config = {
  matcher: ['/:path*'],
};