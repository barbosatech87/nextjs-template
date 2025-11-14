"use client";

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { UserReadingPlan, Verse } from '@/types/supabase';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { updateReadingProgress } from '@/app/actions/plans';

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
    },
    es: {
        day: "Día",
        markAsRead: "Marcar como completado",
        markAsUnread: "Marcar como no completado",
        nextDay: "Día siguiente",
        prevDay: "Día anterior",
        readingOf: "Lectura de",
        updateSuccess: "¡Progreso actualizado!",
        updateError: "Error al actualizar el progreso.",
    }
};

export const ReadingView: React.FC<ReadingViewProps> = ({
    lang,
    plan,
    verses,
    currentDay,
    totalDays,
    completedDays,
    chaptersToRead
}) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const locale = t[lang] || t.pt;

    const isCurrentDayCompleted = completedDays.has(currentDay);

    const handleToggleComplete = () => {
        startTransition(async () => {
            const result = await updateReadingProgress(plan.id, currentDay, !isCurrentDayCompleted, lang);
            if (result.success) {
                toast.success(locale.updateSuccess);
                // A revalidação do path no server action cuida da atualização da UI
            } else {
                toast.error(locale.updateError);
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
                                <Button variant="ghost" size="icon" onClick={handleToggleComplete} disabled={isPending}>
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
                        {verses.map((verse, index) => (
                            <p key={verse.id}>
                                <sup>{verse.verse_number}</sup> {verse.text}
                                {index < verses.length - 1 && ' '}
                            </p>
                        ))}
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