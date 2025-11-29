"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

const GoogleAnalytics = () => {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { consent, hasReplied } = useCookieConsent();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // 1. Só carrega se o usuário já respondeu E aceitou analytics
    if (hasReplied && consent.analytics) {
      // 2. Mantém o atraso estratégico para performance (LCP)
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Se o usuário revogar o consentimento, poderíamos tentar limpar,
      // mas o script já injetado é difícil de remover. 
      // O importante é garantir que na próxima navegação ou se não carregou, não carregue.
      setShouldLoad(false);
    }
  }, [consent.analytics, hasReplied]);

  if (!gaMeasurementId || !shouldLoad) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}', {
              page_path: window.location.pathname,
              anonymize_ip: true, // Boa prática de privacidade adicional
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;