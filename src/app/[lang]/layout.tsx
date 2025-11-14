import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { LocalizedLayoutProps } from "@/types/next-app";
import { MainLayout } from "@/components/layout/main-layout";

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function RootLangLayout({
  children,
  params,
}: LocalizedLayoutProps) {
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