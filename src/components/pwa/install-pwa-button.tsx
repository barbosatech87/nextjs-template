"use client";

import React from 'react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

const texts = {
  pt: { install: "Instalar App" },
  en: { install: "Install App" },
  es: { install: "Instalar App" },
};

interface InstallPWAButtonProps {
  lang: Locale;
}

export function InstallPWAButton({ lang }: InstallPWAButtonProps) {
  const [isInstallable, handleInstall] = useInstallPrompt();
  const t = texts[lang] || texts.pt;

  if (!isInstallable) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" onClick={handleInstall}>
      <Download className="mr-2 h-4 w-4" />
      {t.install}
    </Button>
  );
}