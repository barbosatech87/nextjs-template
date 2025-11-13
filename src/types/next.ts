import { ReactNode } from 'react';

// Define um tipo genérico para os parâmetros da rota
type RouteParams = { [key: string]: string | string[] | undefined };

// Define um tipo genérico para os parâmetros de busca
type SearchParams = { [key: string]: string | string[] | undefined };

/**
 * Props para um componente de Página do Next.js (app router).
 */
export type PageProps = {
  params: RouteParams;
  searchParams?: SearchParams;
};

/**
 * Props para um componente de Layout do Next.js (app router).
 */
export type LayoutProps = {
  children: ReactNode;
  params: RouteParams;
};