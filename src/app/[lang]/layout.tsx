import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ReactNode } from "react";

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: Locale };
}) {
  const { lang } = params;
  
  return (
    <>
      <LangSetter lang={lang} />
      <SessionContextProvider>
        <div className="flex flex-col min-h-screen">
          <Header lang={lang} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer lang={lang} />
        </div>
        <Toaster />
      </SessionContextProvider>
    </>
  );
}