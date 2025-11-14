import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';

interface LangLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default function LangLayout({ children, params }: LangLayoutProps) {
  return (
    <>
      <LangSetter lang={params.lang} />
      {children}
    </>
  );
}