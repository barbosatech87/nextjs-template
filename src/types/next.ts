import { Locale } from "@/lib/i18n/config";
import { ReactNode } from "react";

export interface LocalizedParams {
  lang: Locale;
}

export interface LocalizedPageProps {
  params: LocalizedParams;
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: LocalizedParams;
}