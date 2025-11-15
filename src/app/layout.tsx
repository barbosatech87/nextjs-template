import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';
import { Metadata } from 'next';

interface RootLayoutProps {
  children: ReactNode;
}

// Adicionando metadados base para SEO e a metatag do AdSense
export const metadata: Metadata = {
  metadataBase: new URL('https://www.paxword.com'), // Substitua pelo seu domínio
  title: {
    default: 'PaxWord - Explore a Palavra',
    template: '%s | PaxWord',
  },
  description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
  openGraph: {
    title: 'PaxWord - Explore a Palavra',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
    siteName: 'PaxWord',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PaxWord - Explore a Palavra',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
  },
  manifest: '/manifest.json',
  other: {
    'google-adsense-account': 'ca-pub-5872513184553634',
  },
};


export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // O atributo lang será definido no layout [lang]
    <html suppressHydrationWarning>
      <body>
        {/* O script do AdSense foi removido daqui e substituído pela metatag acima */}
        <SessionContextProvider>
          <GoogleAnalytics />
          {children}
          <Toaster />
        </SessionContextProvider>
      </body>
    </html>
  );
}