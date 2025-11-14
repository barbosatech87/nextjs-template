"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Star } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { UserReadingPlan, Verse } from '@/types/supabase';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { updateReadingProgress } from '@/app/actions/plans';
import { toggleFavoriteVerse } from '@/app/actions/favorites';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadingViewProps {
    lang: Locale;
    plan: UserReadingPlan;
    verses: Verse[];
    currentDay: number;
    totalDays: number;
    completedDays: Set<number>;
    chaptersToRead: { book: string; chapter: number }[];
    initialFavoriteVerseIds: Set<string>;
}

const t = {
    pt: {
        day: "Dia",
        markAsRead: "Marcar como concluído",
        markAsUnread: "Marcar como não concluído",
        nextDay: "Próximo dia",
        prevDay: "Dia anterior",
        readingOf: "Leitura de",
        updateSuccess: "Progresso atualizado!",
        updateError: "Erro ao atualizar progresso.",
        favorite: "Favoritar",
        unfavorite: "Remover dos favoritos",
        favoriteSuccess: "Adicionado aos favoritos!",
        unfavoriteSuccess: "Removido dos favoritos!",
        favoriteError: "Erro ao gerenciar favoritos.",
    },
    en: {
        day: "Day",
        markAsRead: "Mark as completed",
        markAsUnread: "Mark as not completed",
        nextDay: "Next day",
        prevDay: "Previous day",
        readingOf: "Reading of",
        updateSuccess: "Progress updated!",
        updateError: "Error updating progress.",
        favorite: "Favorite",
        unfavorite: "Remove from favorites",
        favoriteSuccess: "Added to favorites!",
        unfavoriteSuccess: "Removed from favorites!",
        favoriteError: "Error managing favorites.",
    },
    es: {
        day: "Día",
        markAsRead: "Marcar como completado",
        markAsUnread: "Marcar como no completado",
        nextDay: "Día siguiente",
        prevDay: "Día anterior",
        readingOf: "Lectura de",
        updateSuccess: "¡Progresso actualizado!",
        updateError: "Error al actualizar el progreso.",
        favorite: "Marcar como favorito",
        unfavorite: "Quitar de favoritos",
        favoriteSuccess: "¡Añadido a favoritos!",
        unfavoriteSuccess: "¡Quitado de favoritos!",
        favoriteError: "Error al gestionar favoritos.",
    }
};

export const ReadingView: React.FC<ReadingViewProps> = ({
    lang,
    plan,
    verses,
    currentDay,
    totalDays,
    completedDays,
    chaptersToRead,
    initialFavoriteVerseIds
}) => {
    const [isProgressPending, startProgressTransition] = useTransition();
    const [isFavoritePending, startFavoriteTransition] = useTransition();
    const [optimisticFavorites, setOptimisticFavorites] = useState(initialFavoriteVerseIds);
    const locale = t[lang] || t.pt;

    const isCurrentDayCompleted = completedDays.has(currentDay);

    const handleToggleComplete = () => {
        startProgressTransition(async () => {
            const result = await updateReadingProgress(plan.id, currentDay, !isCurrentDayCompleted, lang);
            if (result.success) {
                toast.success(locale.updateSuccess);
            } else {
                toast.error(locale.updateError);
            }
        });
    };

    const handleToggleFavorite = (verse: Verse) => {
        const isFavorited = optimisticFavorites.has(verse.id);
        
        // Optimistic update
        setOptimisticFavorites(prev => {
            const newSet = new Set(prev);
            if (isFavorited) {
                newSet.delete(verse.id);
            } else {
                newSet.add(verse.id);
            }
            return newSet;
        });

        startFavoriteTransition(async () => {
            const result = await toggleFavoriteVerse(verse, isFavorited);
            if (result.success) {
                toast.success(isFavorited ? locale.unfavoriteSuccess : locale.favoriteSuccess);
            } else {
                toast.error(locale.favoriteError);
                // Revert optimistic update on error
                setOptimisticFavorites(initialFavoriteVerseIds);
            }
        });
    };
    
    const readingReference = chaptersToRead.map(c => `${getTranslatedBookName(c.book, lang)} ${c.chapter}`).join(', ');

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{plan.custom_plan_name}</h1>
                <p className="text-xl text-muted-foreground mt-1">{`${locale.day} ${currentDay} / ${totalDays}`}</p>
            </header>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between bg-muted/50">
                    <CardTitle>{`${locale.readingOf} ${readingReference}`}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleToggleComplete} disabled={isProgressPending}>
                                    {isCurrentDayCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isCurrentDayCompleted ? locale.markAsUnread : locale.markAsRead}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {verses.map((verse) => {
                            const isFavorited = optimisticFavorites.has(verse.id);
                            return (
                                <div key={verse.id} className="flex items-start gap-2 group">
                                    <p className="flex-1">
                                        <sup>{verse.verse_number}</sup> {verse.text}
                                    </p>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => handleToggleFavorite(verse)} disabled={isFavoritePending}>
                                                    <Star className={`h-4 w-4 ${isFavorited ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground'}`} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{isFavorited ? locale.unfavorite : locale.favorite}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <footer className="mt-8 flex justify-between items-center">
                <Button asChild variant="outline" disabled={currentDay <= 1}>
                    <Link href={`/${lang}/plans/${plan.id}?day=${currentDay - 1}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        {locale.prevDay}
                    </Link>
                </Button>
                <Button asChild variant="outline" disabled={currentDay >= totalDays}>
                    <Link href={`/${lang}/plans/${plan.id}?day=${currentDay + 1}`}>
                        {locale.nextDay}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </footer>
        </div>
    );
};