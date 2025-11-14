"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReadingPlansTabProps {
  lang: Locale;
}

const texts = {
  pt: {
    title: "Meus Planos de Leitura",
    description: "Acompanhe seu progresso nos planos de leitura bíblica.",
    empty: "Você ainda não iniciou nenhum plano de leitura.",
    comingSoon: "Funcionalidade de Planos de Leitura em breve!",
  },
  en: {
    title: "My Reading Plans",
    description: "Track your progress in Bible reading plans.",
    empty: "You haven't started any reading plans yet.",
    comingSoon: "Reading Plans feature coming soon!",
  },
  es: {
    title: "Mis Planes de Lectura",
    description: "Sigue tu progreso en los planes de lectura bíblica.",
    empty: "Aún no has comenzado ningún plan de lectura.",
    comingSoon: "¡La función de Planes de Lectura estará disponible pronto!",
  },
};

export const ReadingPlansTab: React.FC<ReadingPlansTabProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{t.description}</p>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-lg font-semibold text-primary">{t.comingSoon}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.empty}</p>
        </div>
        {/* TODO: Implementar a listagem real de planos aqui */}
      </CardContent>
    </Card>
  );
};