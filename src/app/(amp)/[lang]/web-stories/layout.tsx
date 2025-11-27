import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';

interface WebStoryLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export default function WebStoryLayout({ children }: WebStoryLayoutProps) {
  // This layout just passes children through, ensuring no extra wrappers
  // are added between the AMP body and the amp-story component.
  return <>{children}</>;
}