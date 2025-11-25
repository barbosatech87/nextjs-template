import { ReactNode } from 'react';
import { Locale, i18n } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';
import { notFound } from 'next/navigation';

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

// Esta função diz ao Next.js para gerar estaticamente as rotas /pt, /en e /es
// Isso elimina o tempo de espera do servidor (FCP) quase totalmente.
export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  // O LangSetter define o atributo lang no <html>
  return (
    <>
      <LangSetter lang={lang} />
      <MainLayout lang={lang}>
        {children}
      </MainLayout>
    </>
  );
}