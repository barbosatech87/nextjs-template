import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

// Define a estrutura de params esperada pelo Next.js para Server Components
export interface NextLocalizedParams {
  lang: Locale;
  [key: string]: string | string[] | undefined;
}

export interface LocalizedPageProps {
  params: NextLocalizedParams;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: NextLocalizedParams;
}