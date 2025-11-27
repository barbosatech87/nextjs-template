import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';
import { Metadata, Viewport } from 'next';
import AdsenseScript from '@/components/ads/adsense-script';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';

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

// Metadados foram movidos para [lang]/layout.tsx para suportar múltiplos idiomas
// Apenas configurações não traduzíveis permanecem aqui.
export const metadata: Metadata = {
  metadataBase: new URL('https://www.paxword.com'),
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const isAmp = headersList.get('x-is-amp') === 'true';

  return (
    <html 
      suppressHydrationWarning 
      className={inter.variable}
      {...(isAmp ? { amp: "" } : {})}
    >
      <body className={`font-sans ${!isAmp ? 'antialiased' : ''}`}>
        {!isAmp && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        
        {isAmp ? (
          // Em páginas AMP, renderizamos apenas o conteúdo (que inclui o amp-story)
          // sem os wrappers de contexto e scripts de terceiros proibidos no AMP.
          children
        ) : (
          <SessionContextProvider>
            <AdsenseScript adsenseClientId={adsenseClientId} />
            <GoogleAnalytics />
            {children}
            <SpeedInsights />
            <Toaster />
          </SessionContextProvider>
        )}
      </body>
    </html>
  );
}