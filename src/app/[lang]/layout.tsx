import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { use } from "react";
import { LocalizedLayoutProps } from "@/types/next";

// Garante que o Next.js gere páginas para todos os idiomas
export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LocalizedLayout({
  children,
  params,
}: LocalizedLayoutProps) {
  const { lang } = use(params);
  
  return (
    <>
      <LangSetter lang={lang} />
      <SessionContextProvider>
        <div className="flex-grow flex flex-col min-h-screen">
          {children}
        </div>
        <Toaster />
      </SessionContextProvider>
    </>
  );
}