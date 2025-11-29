"use client";

import React, { useState } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Locale } from '@/lib/i18n/config';
import { CookieSettingsDialog } from './cookie-settings-dialog';
import { Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

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
</dyad-file>

### 3. Integração na Aplicação

Agora precisamos adicionar este banner ao layout principal para que ele apareça em todas as páginas.

<dyad-write path="src/app/[lang]/layout.tsx" description="Adding the CookieBanner to the main layout.">
import { ReactNode } from 'react';
import { Locale, i18n } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CookieBanner } from '@/components/consent/cookie-banner'; // Importação nova
import '@/app/globals.css'; 

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

const pageTexts = {
  pt: {
    title: 'PaxWord - Explore a Palavra de Deus com Estudos e Devocionais',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé com ferramentas de estudo e IA.',
  },
  en: {
    title: 'PaxWord - Explore God\'s Word with Studies and Devotionals',
    description: 'A place to explore the Bible, find reading plans, devotionals, and deepen your faith with study and AI tools.',
  },
  es: {
    title: 'PaxWord - Explora la Palabra de Dios con Estudios y Devocionales',
    description: 'Un lugar para explorar la Biblia, encontrar planes de lectura, devocionales y profundizar tu fe con herramientas de estudio e IA.',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params;
  const currentLang = lang || i18n.defaultLocale;
  const t = pageTexts[currentLang] || pageTexts.pt;

  return {
    title: {
      default: t.title,
      template: '%s | PaxWord',
    },
    description: t.description,
    openGraph: {
      title: {
        default: t.title,
        template: '%s | PaxWord',
      },
      description: t.description,
      siteName: 'PaxWord',
      locale: currentLang,
      type: 'website',
      images: [
        {
          url: '/social-share.png',
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: t.title,
        template: '%s | PaxWord',
      },
      description: t.description,
      images: ['/social-share.png'],
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  return (
    <>
      <LangSetter lang={lang} />
      <MainLayout lang={lang}>
        {children}
      </MainLayout>
      <CookieBanner lang={lang} />
    </>
  );
}