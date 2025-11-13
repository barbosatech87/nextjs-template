import { ReactNode } from 'react';

/**
 * Props for a Page component in Next.js (app router).
 * We make it generic for both params and searchParams.
 */
export type AppPageProps<
  TParams = any,
  TSearchParams = any
> = {
  params: TParams;
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * We make it generic for params.
 */
export type AppLayoutProps<
  TParams = any
> = {
  children: ReactNode;
  params: TParams;
};