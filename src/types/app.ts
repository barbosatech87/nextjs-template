import { ReactNode } from 'react';

/**
 * Props for a Page component in Next.js (app router).
 * The `params` and `searchParams` are generic to allow for specific
 * types in each page component.
 */
export type AppPageProps<
  TParams extends { [key: string]: string | string[] } = {},
  TSearchParams extends { [key: string]: string | string[] | undefined } = {}
> = {
  params: TParams;
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * The `params` are generic to allow for specific types in each layout.
 */
export type AppLayoutProps<
  TParams extends { [key: string]: string | string[] } = {}
> = {
  children: ReactNode;
  params: TParams;
};