"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, ListChecks, PlusCircle, BookMarked } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface PlansLoginPromptProps {
  lang: Locale;
}

const texts = {
  pt: {
    title: "Desbloqueie os Planos de Leitura",
    description: "Crie, acompanhe e explore planos de leitura bíblica personalizados para a sua jornada espiritual. Este é um recurso exclusivo para membros.",
    features: [
      { icon: PlusCircle, text: "Crie planos personalizados com seus livros preferidos." },
      { icon: ListChecks, text: "Acompanhe seu progresso diário e mantenha o foco." },
      { icon: BookMarked, text: "Explore planos pré-configurados por nossa equipe." },
    ],
    login: "Fazer Login ou Cadastrar para Começar",
  },
  en: {
    title: "Unlock Reading Plans",
    description: "Create, track, and explore personalized Bible reading plans for your spiritual journey. This is an exclusive feature for members.",
    features: [
      { icon: PlusCircle, text: "Create custom plans with your favorite books." },
      { icon: ListChecks, text: "Track your daily progress and stay focused." },
      { icon: BookMarked, text: "Explore pre-configured plans curated by our team." },
    ],
    login: "Log In or Register to Get Started",
  },
  es: {
    title: "Desbloquea los Planes de Lectura",
    description: "Crea, sigue y explora planes de lectura bíblica personalizados para tu viaje espiritual. Esta es una función exclusiva para miembros.",
    features: [
      { icon: PlusCircle, text: "Crea planes personalizados con tus libros favoritos." },
      { icon: ListChecks, text: "Sigue tu progreso diario y mantente enfocado." },
      { icon: BookMarked, text: "Explora planes preconfigurados por nuestro equipo." },
    ],
    login: "Iniciar Sesión o Registrarse para Empezar",
  },
};

export const PlansLoginPrompt: React.FC<PlansLoginPromptProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;

  return (
    <div className="container mx-auto py-16 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center p-8 bg-card border rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-primary mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t.description}</p>
        
        <ul className="space-y-4 text-left mb-10 inline-block">
          {t.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <feature.icon className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-foreground">{feature.text}</span>
            </li>
          ))}
        </ul>

        <div>
          <Button asChild size="lg">
            <Link href={`/${lang}/auth`}>
              <LogIn className="mr-2 h-5 w-5" />
              {t.login}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};