import { ReactNode } from 'react';

/**
 * A general type for Next.js page/layout params.
 * Using a specific dictionary type `{ [key: string]: string }` helps satisfy
 * the internal Next.js type checker which seems to have issues with more
 * complex generic types in recent versions.
 */
type NextJsParams = { [key: string]: string };

/**
 * Props for a Page component in Next.js (app router).
 * The `params` type is simplified to avoid build-time errors with Next.js 15+.
 * The `searchParams` generic is kept for type-safe access to query parameters.
 */
export type AppPageProps<
  TSearchParams extends { [key: string]: string | string[] | undefined } = {}
> = {
  params: NextJsParams;
  searchParams?: TSearchParams;
};

/**
 * Props for a Layout component in Next.js (app router).
 * The `params` type is simplified to avoid build-time errors.
 */
export type AppLayoutProps = {
  children: ReactNode;
  params: NextJsParams;
};