"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Locale } from '@/lib/i18n/config';
import { CookieSettingsDialog } from './cookie-settings-dialog';
import { Cookie } from 'lucide-react';
import { getCookieBannerDictionary } from '@/lib/i18n/dictionaries/cookie-banner';

interface CookieBannerProps {
  lang: Locale;
}

export function CookieBanner({ lang }: CookieBannerProps) {
  const { isOpen, consent, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = getCookieBannerDictionary(lang);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 pointer-events-auto">
        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 max-w-lg">
          <CardContent className="p-4 md:p-6 flex flex-col items-start gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium leading-relaxed">
                  {t.text1}
                  <Link href={`/${lang}/p/politica-de-privacidade`} className="underline hover:text-primary font-semibold">
                    {t.privacyPolicy}
                  </Link>
                  {t.text2}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full self-end">
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