import { ReactNode } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Locale } from '@/lib/i18n/config';

interface MainLayoutProps {
  children: ReactNode;
  lang: Locale;
}

export function MainLayout({ children, lang }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header lang={lang} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}