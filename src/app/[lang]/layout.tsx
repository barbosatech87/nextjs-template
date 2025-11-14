import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';

interface RootLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = params;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <SessionContextProvider>
          <LangSetter lang={lang} />
          {children}
          <Toaster />
        </SessionContextProvider>
      </body>
    </html>
  );