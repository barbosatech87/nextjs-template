import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

export default function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { lang: Locale };
}) {
  const { lang } = params;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header lang={lang} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer lang={lang} />
    </div>
  );
}