import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Viewport } from 'next';
import '@/app/globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', 
});

interface AmpRootLayoutProps {
  children: ReactNode;
}

export const viewport: Viewport = {
  width: "device-width",
  minimumScale: 1,
  initialScale: 1,
};

export default function AmpRootLayout({ children }: AmpRootLayoutProps) {
  // This is a root layout, so it needs to render the html and body tags.
  // It will replace the main src/app/layout.tsx for routes inside (amp).
  // Note: We don't have access to the `lang` param here, so it's omitted for now,
  // but the page will still be a valid AMP page.
  return (
    <html amp="" className={inter.variable}>
      <head />
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}