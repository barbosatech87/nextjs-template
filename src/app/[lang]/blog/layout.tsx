import { Locale } from "@/lib/i18n/config";
import { ReactNode } from "react";

export default function BlogLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: { lang: Locale };
}>) {
  // Não precisamos usar params aqui, apenas aceitar para satisfazer o tipo do Next.
  return <>{children}</>;
}