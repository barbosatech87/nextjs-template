import { AppLayoutProps } from "@/types/app";

export default function BlogLayout({
  children,
}: AppLayoutProps) {
  // Não precisamos usar params aqui, apenas aceitar para satisfazer o tipo do Next.
  return <>{children}</>;
}