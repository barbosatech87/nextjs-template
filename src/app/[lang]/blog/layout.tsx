import { Locale } from "@/lib/i18n/config";
import { ReactNode } from "react";

interface BlogLayoutProps {
  children: ReactNode;
  params: { lang: Locale }; // Corrigido
}

export default async function BlogLayout({
  children,
  params,
}: BlogLayoutProps) {
  // Não precisamos usar params aqui, apenas aceitar para satisfazer o tipo do Next.
  return <>{children}</>;
}