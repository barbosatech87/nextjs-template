import { SessionContextProvider } from "@/components/auth/session-context-provider";
import { i18n, Locale } from "@/lib/i18n/config";
import { Toaster } from "@/components/ui/sonner";
import { LangSetter } from "@/components/i18n/lang-setter";
import { use } from "react";

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LocalizedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
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