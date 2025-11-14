import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';

interface LangLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default function LangLayout({ children, params }: LangLayoutProps) {
  // O LangSetter define o atributo lang no <html>
  return (
    <>
      <LangSetter lang={params.lang} />
      <MainLayout lang={params.lang}>
        {children}
      </MainLayout>
    </>
  );
}