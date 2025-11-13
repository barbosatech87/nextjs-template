import { ReactNode } from 'react';

type StringRecord = Record<string, string | string[] | undefined>;

/**
 * Props for a Page component in Next.js (app router).
 * We make it generic for both params and searchParams.
 */
export type AppPageProps<
  TParams extends StringRecord = {},
  TSearchParams extends StringRecord = {}
> = {
  params: TParams;
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * We make it generic for params.
 */
export type AppLayoutProps<
  TParams extends StringRecord = {}
> = {
  children: ReactNode;
  params: TParams;
};