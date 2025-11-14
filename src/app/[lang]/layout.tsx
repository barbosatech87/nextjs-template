import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { ReactNode } from "react";
import { MainLayout } from "@/components/layout/main-layout";

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

interface RootLangLayoutProps {
  children: ReactNode;
  params: { lang: Locale }; // Corrigido: Removido Awaited
}

export default async function RootLangLayout({
  children,
  params,
}: RootLangLayoutProps) {
  const { lang } = params;
  
  return (
    <>
      <LangSetter lang={lang} />
      <SessionContextProvider>
        <MainLayout lang={lang}>
          {children}
        </MainLayout>
        <Toaster />
      </SessionContextProvider>
    </>
  );
}