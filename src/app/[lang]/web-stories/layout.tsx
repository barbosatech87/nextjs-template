import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';

interface WebStoryLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

export default async function WebStoryLayout({ children }: WebStoryLayoutProps) {
  // Retorna apenas os filhos, sem Header/Footer/Container do layout principal
  return (
    <div className="w-full h-screen m-0 p-0 bg-black text-white">
      {children}
    </div>
  );
}