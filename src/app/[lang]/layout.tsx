import { ReactNode } from 'react';
import { Locale, i18n } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';
import { notFound } from 'next/navigation';

interface LangLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = params;

  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  return (
    <>
      <LangSetter lang={lang} />
      <MainLayout lang={lang}>
        {children}
      </MainLayout>
    </>
  );
}