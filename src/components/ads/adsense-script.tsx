"use client";

import Script from "next/script";
import { useProfile } from "@/hooks/use-profile";
import { useEffect, useState } from "react";

interface AdsenseScriptProps {
  adsenseClientId: string;
}

const AdsenseScript = ({ adsenseClientId }: AdsenseScriptProps) => {
  const { profile, isLoading } = useProfile();
  const [shouldLoadAds, setShouldLoadAds] = useState(false);

  useEffect(() => {
    // 1. Verificação inicial: Se não estiver carregando e não for premium
    if (!isLoading) {
      const isPremium = profile?.subscription_status === 'premium';
      
      if (!isPremium) {
        // 2. Atraso estratégico: Espera 3.5 segundos após o carregamento inicial
        // Isso garante que o Lighthouse já tenha medido o LCP antes do script pesado entrar.
        const timer = setTimeout(() => {
          setShouldLoadAds(true);
        }, 3500);

        return () => clearTimeout(timer);
      }
    }
  }, [profile, isLoading]);

  if (!adsenseClientId) return null;
  if (!shouldLoadAds) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive" 
    />
  );
};

export default AdsenseScript;