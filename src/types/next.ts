import { Locale } from "@/lib/i18n/config";
import { ReactNode } from "react";

export interface LocalizedPageProps {
  params: { lang: Locale };
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}