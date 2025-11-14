"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FavoritesTabProps {
  lang: Locale;
}

const texts = {
  pt: {
    title: "Meus Versículos Favoritos",
    description: "Aqui você encontrará todos os versículos que marcou como favoritos.",
    empty: "Você ainda não adicionou nenhum versículo aos seus favoritos.",
  },
  en: {
    title: "My Favorite Verses",
    description: "Here you will find all the verses you have marked as favorites.",
    empty: "You haven't added any verses to your favorites yet.",
  },
  es: {
    title: "Mis Versículos Favoritos",
    description: "Aquí encontrarás todos los versículos que has marcado como favoritos.",
    empty: "Aún no has añadido ningún versículo a tus favoritos.",
  },
};

export const FavoritesTab: React.FC<FavoritesTabProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{t.description}</p>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        </div>
        {/* TODO: Implementar a listagem real de favoritos aqui */}
      </CardContent>
    </Card>
  );
};