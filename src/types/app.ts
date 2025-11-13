import { ReactNode } from 'react';

/**
 * A general type for Next.js page/layout params.
 */
type NextJsParams = { [key: string]: string | string[] | undefined };

/**
 * Props for a Page component in Next.js (app router).
 * We make it generic for both params and searchParams.
 */
export type AppPageProps<
  TParams extends NextJsParams = {},
  TSearchParams extends { [key: string]: string | string[] | undefined } = {}
> = {
  params: TParams;
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * We make it generic for params.
 */
export type AppLayoutProps<TParams extends NextJsParams = {}> = {
  children: ReactNode;
  params: TParams;
};