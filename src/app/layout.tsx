import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';
import { Metadata, Viewport } from 'next';
import AdsenseScript from '@/components/ads/adsense-script';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', 
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.paxword.com'),
  title: {
    default: 'PaxWord - Explore a Palavra de Deus com Estudos e Devocionais',
    template: '%s | PaxWord',
  },
  description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé com ferramentas de estudo e IA.',
  openGraph: {
    title: 'PaxWord - Explore a Palavra de Deus',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
    siteName: 'PaxWord',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/social-share.png',
        width: 1200,
        height: 630,
        alt: 'PaxWord - Explore a Palavra de Deus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PaxWord - Explore a Palavra de Deus',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
    images: ['/social-share.png'],
  },
  manifest: '/manifest.json',
  other: {
    'google-adsense-account': 'ca-pub-5872513184553634',
  },
};

const adsenseClientId = 'ca-pub-5872513184553634';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'PaxWord',
  'url': 'https://www.paxword.com',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': 'https://www.paxword.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionContextProvider>
          <AdsenseScript adsenseClientId={adsenseClientId} />
          <GoogleAnalytics />
          {children}
          <SpeedInsights />
          <Toaster />
        </SessionContextProvider>
      </body>
    </html>
  );
}