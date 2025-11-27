import { ReactNode } from 'react';
import { Locale } from '@/lib/i18n/config';
import { Inter } from 'next/font/google';
import { Viewport } from 'next';
import '@/app/globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', 
});

interface AmpLayoutProps {
  children: ReactNode;
  params: { lang: Locale };
}

export const viewport: Viewport = {
  width: "device-width",
  minimumScale: 1,
  initialScale: 1,
};

export default function AmpLangLayout({ children, params }: AmpLayoutProps) {
  return (
    <html lang={params.lang} amp className={inter.variable}>
      <head />
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}