import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { MainLayout } from "@/components/layout/main-layout";
import { ReactNode } from "react";

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default function RootLangLayout({
  children,
  params,
}: { children: ReactNode; params: { lang: Locale } }) {
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