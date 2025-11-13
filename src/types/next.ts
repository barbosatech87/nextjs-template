import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

// Esta interface permanece pois é um bloco de construção útil.
export interface NextLocalizedParams {
  lang: Locale;
  [key: string]: string | string[] | undefined;
}

// As interfaces LocalizedPageProps e LocalizedLayoutProps foram removidas
// para evitar conflitos de tipo com o Next.js.