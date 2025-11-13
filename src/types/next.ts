import { ReactNode } from "react";
import { Locale } from "@/lib/i18n/config";

// The previous generic approach was not fully compatible with Next.js's type checker.
// Using an index signature `[key: string]: string | string[] | undefined` makes
// the params type more explicit and flexible. It defines an object that must
// contain `lang`, but can also hold any other dynamic route parameters,
// which should resolve the compilation errors.

export interface LocalizedPageProps {
  params: { lang: Locale; [key: string]: string | string[] | undefined };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: { lang: Locale; [key: string]: string | string[] | undefined };
}