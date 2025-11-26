"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GoogleAnalytics = () => {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Atrasa o carregamento do GA para não impactar o FCP/LCP
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 2500); // Carrega um pouco antes do AdSense

    return () => clearTimeout(timer);
  }, []);

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
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;