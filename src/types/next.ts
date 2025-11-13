import { ReactNode } from "react";

export interface LocalizedPageProps {
  params: { [key: string]: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export interface LocalizedLayoutProps {
  children: ReactNode;
  params: { [key: string]: string };
}