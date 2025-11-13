import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Negotiator from 'negotiator';
import { i18n } from '@/lib/i18n/config';

// NOTA: Este componente é uma solução alternativa para um problema de compilação.
// A lógica de redirecionamento principal está em `src/middleware.ts`.
// Esta página existe para satisfazer o processo de compilação do Next.js que espera uma página raiz.
// Em um fluxo normal, o middleware redirecionará antes que esta página seja renderizada.
export default function RootPage() {
  // 1. Obter os idiomas do navegador a partir dos cabeçalhos
  const headersList = headers();
  const negotiatorHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => (negotiatorHeaders[key] = value));

  // 2. Encontrar a melhor localidade correspondente
  const locales: string[] = [...i18n.locales];
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales);
  const locale = languages[0] || i18n.defaultLocale;

  // 3. Redirecionar para a página inicial localizada
  redirect(`/${locale}`);
}