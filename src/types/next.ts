import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

export interface LocalizedPageProps {
  params: { lang: Locale; [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: { lang: Locale; [key: string]: string | string[] | undefined };
}