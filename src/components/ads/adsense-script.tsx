"use client";

import Script from "next/script";

interface AdsenseScriptProps {
  adsenseClientId: string;
}

const AdsenseScript = ({ adsenseClientId }: AdsenseScriptProps) => {
  // Se o ID do cliente não for fornecido, não renderiza o script.
  if (!adsenseClientId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('ID de cliente do AdSense não fornecido. Anúncios não serão exibidos.');
    }
    return null;
  }

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