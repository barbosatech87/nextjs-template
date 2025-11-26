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
    // Só decide se carrega anúncios quando terminar de carregar o perfil
    if (!isLoading) {
      // Se não tiver perfil (não logado) ou se o status não for premium, mostra anúncios
      const isPremium = profile?.subscription_status === 'premium';
      if (!isPremium) {
        setShouldLoadAds(true);
      }
    }
  }, [profile, isLoading]);

  // Se o ID do cliente não for fornecido, não renderiza o script.
  if (!adsenseClientId) return null;

  // Não renderiza nada enquanto decide ou se for premium
  if (!shouldLoadAds) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
};

export default AdsenseScript;