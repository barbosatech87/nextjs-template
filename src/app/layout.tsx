import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import AdsenseScript from '@/components/ads/adsense-script';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.paxword.com'),
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
    images: [
      {
        url: '/social-share.png',
        width: 1200,
        height: 630,
        alt: 'PaxWord - Explore a Palavra',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PaxWord - Explore a Palavra',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé.',
    images: ['/social-share.png'],
  },
  manifest: '/manifest.json',
  other: {
    'google-adsense-account': 'ca-pub-5872513184553634',
  },
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser();

  let shouldShowAds = true;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (profile && profile.subscription_status !== 'free') {
      shouldShowAds = false;
    }
  }

  const adsenseClientId = 'ca-pub-5872513184553634';

  return (
    <html suppressHydrationWarning className={inter.variable}>
      <head>
        {shouldShowAds && <AdsenseScript adsenseClientId={adsenseClientId} />}
      </head>
      <body className="font-sans antialiased">
        <SessionContextProvider>
          <GoogleAnalytics />
          {children}
          <SpeedInsights />
          <Toaster />
        </SessionContextProvider>
      </body>
    </html>
  );
}