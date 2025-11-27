import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import { Metadata, Viewport } from 'next';
import AdsenseScript from '@/components/ads/adsense-script';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { i18n } from '@/lib/i18n/config';

// NOTE: globals.css removed from here to prevent loading on AMP pages.
// It is now imported in src/app/[lang]/layout.tsx

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
  const pathname = headersList.get('next-url') || '/';
  const lang = i18n.locales.find(l => pathname.startsWith(`/${l}`)) || i18n.defaultLocale;
  const isAmp = headersList.get('x-is-amp') === 'true';

  // AMP SHELL: Renderização estrita para Google AMP
  if (isAmp) {
    return (
      <html amp="" lang={lang} suppressHydrationWarning>
        <head suppressHydrationWarning>
          <meta charSet="utf-8" />
          <script async src="https://cdn.ampproject.org/v0.js"></script>
          <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
          <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
          {/* AMP Boilerplate - Obrigatório */}
          <style amp-boilerplate="">
            {`body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`}
          </style>
          <noscript>
            <style amp-boilerplate="">
              {`body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`}
            </style>
          </noscript>
        </head>
        <body suppressHydrationWarning>
          {children}
        </body>
      </html>
    );
  }

  // STANDARD SHELL: Renderização normal do Next.js
  return (
    <html 
      suppressHydrationWarning 
      className={inter.variable}
      lang={lang}
    >
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