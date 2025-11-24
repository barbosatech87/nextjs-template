import { ReactNode } from 'react';
import { SessionContextProvider } from '@/components/auth/session-context-provider';
import { Toaster } from '@/components/ui/sonner';
import GoogleAnalytics from '@/components/analytics/google-analytics';
import './globals.css';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/integrations/supabase/server';
import AdsenseScript from '@/components/ads/adsense-script';
import { SpeedInsights } from "@vercel/speed-insights/next";

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

  let shouldShowAds = true; // Padrão é mostrar anúncios

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    // Esconde anúncios se o usuário estiver logado e seu status NÃO for 'free'
    if (profile && profile.subscription_status !== 'free') {
      shouldShowAds = false;
    }
  }

  const adsenseClientId = 'ca-pub-5872513184553634';

  return (
    // O atributo lang será definido no layout [lang]
    <html suppressHydrationWarning>
      <head>
        {/* O script do AdSense só será renderizado se a condição for verdadeira */}
        {shouldShowAds && <AdsenseScript adsenseClientId={adsenseClientId} />}
      </head>
      <body>
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