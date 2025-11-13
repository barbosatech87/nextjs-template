import { LocalizedLayoutProps } from "@/types/next";
import { ReactNode } from "react";

export default async function BlogLayout({ children, params }: LocalizedLayoutProps) {
  // O Header e Footer são adicionados nas páginas individuais (listagem e detalhe)
  // para evitar problemas de cache e garantir que o Server Component funcione corretamente.
  // Este layout serve apenas como um wrapper de rota.
  return <>{children}</>;
}