import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';

// Tipos base para rotas localizadas
export interface LocalizedParams {
  lang: Locale;
}

// Usando tipos simples para evitar que o Next.js infira Promise<any>
export interface LocalizedPageProps<P = {}> {
  params: LocalizedParams & P;
  searchParams: { [key: string]: string | string[] | undefined } | undefined;
}

export interface LocalizedLayoutProps<P = {}> {
  children: ReactNode;
  params: LocalizedParams & P;
}