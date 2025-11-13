import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

export interface NextLocalizedParams {
  lang: Locale;
  [key: string]: string | string[] | undefined;
}

export interface LocalizedPageProps {
  params: Promise<NextLocalizedParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: Promise<NextLocalizedParams>;
}