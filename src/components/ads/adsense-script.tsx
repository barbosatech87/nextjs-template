"use client";

import Script from "next/script";
import { useProfile } from "@/hooks/use-profile";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { useEffect, useState } from "react";

interface AdsenseScriptProps {
  adsenseClientId: string;
}

const AdsenseScript = ({ adsenseClientId }: AdsenseScriptProps) => {
  const { profile, isLoading } = useProfile();
  const { consent, hasReplied } = useCookieConsent();
  const [shouldLoadAds, setShouldLoadAds] = useState(false);

  useEffect(() => {
    // 1. Verificações preliminares: carregamento perfil e resposta do cookie
    if (!isLoading && hasReplied) {
      const isPremium = profile?.subscription_status === 'premium';
      
      if (!isPremium) {
        // 2. Atraso estratégico para performance (Core Web Vitals)
        const timer = setTimeout(() => {
          setShouldLoadAds(true);
        }, 3500);

        return () => clearTimeout(timer);
      }
    }
  }, [profile, isLoading, hasReplied]);

  if (!adsenseClientId) return null;
  if (!shouldLoadAds) return null;

  // Lógica NPA (Non-Personalized Ads)
  // Se o usuário NÃO deu consentimento de marketing, ativamos o NPA.
  const isNpa = !consent.marketing;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      // Atributos condicionais para o script tag
      {...(isNpa ? { "data-npa-on-ads": "1" } : {})}
    />
  );
};

export default AdsenseScript;