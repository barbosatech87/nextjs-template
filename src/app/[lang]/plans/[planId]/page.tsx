import { Suspense } from 'react';
import { Locale } from "@/lib/i18n/config";
import { getPlanAndProgress, getChaptersText } from "@/app/actions/plans";
import { ReadingView } from '@/components/reading-plans/reading-view';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanPageProps {
    params: {
        lang: Locale;
        planId: string;
    };
    searchParams: {
        day?: string;
    };
}

function ReadingSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    )
}

export default async function PlanPage({ params, searchParams }: PlanPageProps) {
    const { lang, planId } = params;
    const { plan, completedDays } = await getPlanAndProgress(planId);

    const scheduleKeys = Object.keys(plan.daily_reading_schedule).sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));
    const totalDays = scheduleKeys.length;

    // Determina o dia atual para leitura
    let currentDayNumber: number;
    if (searchParams.day && !isNaN(Number(searchParams.day))) {
        currentDayNumber = Math.max(1, Math.min(Number(searchParams.day), totalDays));
    } else {
        // Encontra o primeiro dia não concluído
        const firstUnreadDay = scheduleKeys.find(key => !completedDays.has(parseInt(key.split('_')[1])));
        currentDayNumber = firstUnreadDay ? parseInt(firstUnreadDay.split('_')[1]) : 1;
    }
    
    const currentDayKey = `day_${currentDayNumber}`;
    const chaptersToRead = plan.daily_reading_schedule[currentDayKey] || [];
    const verses = await getChaptersText(chaptersToRead, lang);

    return (
        <div className="container mx-auto py-10">
            <Suspense fallback={<ReadingSkeleton />}>
                <ReadingView
                    lang={lang}
                    plan={plan}
                    verses={verses}
                    currentDay={currentDayNumber}
                    totalDays={totalDays}
                    completedDays={completedDays}
                    chaptersToRead={chaptersToRead}
                />
            </Suspense>
        </div>
    );
}