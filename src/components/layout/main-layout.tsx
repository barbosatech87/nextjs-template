"use client";

import { usePathname } from "next/navigation";
import { Locale } from "@/lib/i18n/config";
import Header from "./header";
import Footer from "./footer";

export function MainLayout({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: Locale;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith(`/${lang}/admin`);

  if (isAdminRoute) {
    // No admin, não renderiza Header/Footer para evitar sobreposição
    return <div className="flex min-h-screen">{children}</div>;
  }

  // Para o site público, renderiza o layout completo
  return (
    <div className="flex flex-col min-h-screen">
      <Header lang={lang} />
      <main className="flex-grow">{children}</main>
      <Footer lang={lang} />
    </div>
  );
}