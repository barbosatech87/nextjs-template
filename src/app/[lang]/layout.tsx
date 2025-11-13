import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { ReactNode } from "react";

// Garante que o Next.js gere páginas para todos os idiomas
export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

interface LocalizedLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default function LocalizedLayout({
  children,
  params,
}: Readonly<LocalizedLayoutProps>) {
  const { lang } = params;
  
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