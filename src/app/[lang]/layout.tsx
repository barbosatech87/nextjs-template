import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

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