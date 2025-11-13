import { ReactNode } from 'react';

/**
 * Props for a Page component in Next.js (app router).
 * We make it generic for both params and searchParams.
 */
export type AppPageProps<
  TParams = {},
  TSearchParams extends { [key: string]: string | string[] | undefined } = {}
> = {
  params: TParams & { [key: string]: string };
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * We make it generic for params.
 */
export type AppLayoutProps<
  TParams = {}
> = {
  children: ReactNode;
  params: TParams & { [key: string]: string };
};