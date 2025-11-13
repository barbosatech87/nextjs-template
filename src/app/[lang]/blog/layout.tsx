import { AppLayoutProps } from "@/types/app";
import { Locale } from "@/lib/i18n/config";

export default function BlogLayout({
  children,
  params,
}: AppLayoutProps<{ lang: Locale }>) {
  // Não precisamos usar params aqui, apenas aceitar para satisfazer o tipo do Next.
  return <>{children}</>;
}