"use client";

import React, { useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heart, Trash2 } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { HydratedFavorite, toggleFavoriteVerse } from '@/app/actions/favorites';
import { getTranslatedBookName } from '@/lib/bible-translations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FavoritesTabProps {
  lang: Locale;
  favorites: HydratedFavorite[];
}

const texts = {
  pt: {
    title: "Meus Versículos Favoritos",
    description: "Aqui você encontrará todos os versículos que marcou como favoritos.",
    empty: "Você ainda não adicionou nenhum versículo aos seus favoritos.",
    unfavorite: "Remover dos favoritos",
    unfavoriteSuccess: "Removido dos favoritos!",
    unfavoriteError: "Erro ao remover dos favoritos.",
  },
  en: {
    title: "My Favorite Verses",
    description: "Here you will find all the verses you have marked as favorites.",
    empty: "You haven't added any verses to your favorites yet.",
    unfavorite: "Remove from favorites",
    unfavoriteSuccess: "Removed from favorites!",
    unfavoriteError: "Error removing from favorites.",
  },
  es: {
    title: "Mis Versículos Favoritos",
    description: "Aquí encontrarás todos los versículos que has marcado como favoritos.",
    empty: "Aún no has añadido ningún versículo a tus favoritos.",
    unfavorite: "Quitar de favoritos",
    unfavoriteSuccess: "¡Quitado de favoritos!",
    unfavoriteError: "Error al quitar de favoritos.",
  },
};

export const FavoritesTab: React.FC<FavoritesTabProps> = ({ lang, favorites }) => {
  const t = texts[lang] || texts.pt;
  const [isPending, startTransition] = useTransition();

  const handleUnfavorite = (favorite: HydratedFavorite) => {
    startTransition(async () => {
      const result = await toggleFavoriteVerse(favorite.verse, true);
      if (result.success) {
        toast.success(t.unfavoriteSuccess);
      } else {
        toast.error(t.unfavoriteError);
      }
    });
  };

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
        
        {favorites.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {favorites.map((fav) => {
              const bookSlug = fav.book.toLowerCase().replace(/\s+/g, '-');
              const reference = `${getTranslatedBookName(fav.book, lang)} ${fav.chapter}:${fav.verse_number}`;
              const href = `/${lang}/bible/${bookSlug}/${fav.chapter}`;

              return (
                <li key={fav.id} className="border-l-4 border-primary/20 pl-4 py-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link href={href} className="hover:underline">
                        <p className="font-semibold text-primary">{reference}</p>
                      </Link>
                      <blockquote className="mt-1 italic text-foreground/80">
                        &ldquo;{fav.text}&rdquo;
                      </blockquote>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleUnfavorite(fav)}
                      disabled={isPending}
                      aria-label={t.unfavorite}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};