"use client";

import React, { useState } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Locale } from '@/lib/i18n/config';
import { CookieSettingsDialog } from './cookie-settings-dialog';
import { Cookie } from 'lucide-react';

interface CookieBannerProps {
  lang: Locale;
}

const texts = {
  pt: {
    text: "Nós utilizamos cookies para melhorar sua experiência e exibir anúncios personalizados. Ao continuar, você concorda com nossa política de privacidade.",
    acceptAll: "Aceitar Tudo",
    rejectNonEssential: "Rejeitar Opcionais",
    customize: "Personalizar",
  },
  en: {
    text: "We use cookies to improve your experience and show personalized ads. By continuing, you agree to our privacy policy.",
    acceptAll: "Accept All",
    rejectNonEssential: "Reject Optional",
    customize: "Customize",
  },
  es: {
    text: "Utilizamos cookies para mejorar tu experiencia y mostrar anuncios personalizados. Al continuar, aceptas nuestra política de privacidad.",
    acceptAll: "Aceptar Todo",
    rejectNonEssential: "Rechazar Opcionales",
    customize: "Personalizar",
  },
};

export function CookieBanner({ lang }: CookieBannerProps) {
  const { isOpen, consent, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = texts[lang] || texts.pt;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-transparent pointer-events-none">
        <div className="container mx-auto max-w-6xl pointer-events-auto">
          <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 text-sm md:text-base">
                  <p className="font-medium leading-relaxed">
                    {t.text}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto min-w-fit">
                <Button variant="ghost" onClick={() => setIsSettingsOpen(true)}>
                  {t.customize}
                </Button>
                <Button variant="outline" onClick={rejectAll}>
                  {t.rejectNonEssential}
                </Button>
                <Button onClick={acceptAll} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t.acceptAll}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CookieSettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        currentConsent={consent}
        onSave={savePreferences}
        lang={lang}
      />
    </>
  );
}