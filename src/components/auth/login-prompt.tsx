"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface LoginPromptProps {
  lang: Locale;
  title: string;
  description: string;
}

const texts = {
  pt: {
    login: "Fazer Login / Cadastrar",
  },
  en: {
    login: "Log In / Register",
  },
  es: {
    login: "Iniciar Sesión / Registrarse",
  },
};

export const LoginPrompt: React.FC<LoginPromptProps> = ({ lang, title, description }) => {
  const t = texts[lang] || texts.pt;

  return (
    <div className="container mx-auto py-20 flex items-center justify-center">
      <Card className="w-full max-w-md text-center p-6">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="pt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href={`/${lang}/auth`}>
              <LogIn className="mr-2 h-4 w-4" />
              {t.login}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};