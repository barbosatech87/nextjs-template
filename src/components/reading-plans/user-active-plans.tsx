"use client";

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { BookOpen, Calendar, Flag } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { UserReadingPlan } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UserActivePlansProps {
  lang: Locale;
  plans: UserReadingPlan[];
}

const locales = { pt: ptBR, en: enUS, es: es };

export const UserActivePlans: React.FC<UserActivePlansProps> = ({ lang, plans }) => {
  const t = {
    pt: { 
      title: "Meus Planos Ativos", 
      empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um?",
      viewPlan: "Ver Plano",
      progress: "Progresso",
      startDate: "Início",
      endDate: "Término",
    },
    en: { 
      title: "My Active Plans", 
      empty: "You don't have any active reading plans. How about starting one?",
      viewPlan: "View Plan",
      progress: "Progress",
      startDate: "Start",
      endDate: "End",
    },
    es: { 
      title: "Mis Planes Activos", 
      empty: "No tienes ningún plan de lectura activo. ¿Qué tal si empiezas uno?",
      viewPlan: "Ver Plan",
      progress: "Progreso",
      startDate: "Inicio",
      endDate: "Fin",
    },
  }[lang] || { 
    title: "Meus Planos Ativos", 
    empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um?",
    viewPlan: "Ver Plano",
    progress: "Progresso",
    startDate: "Início",
    endDate: "Término",
  };

  // TODO: O cálculo do progresso será implementado no próximo passo
  const calculateProgress = (plan: UserReadingPlan) => {
    return 5; // Valor fixo por enquanto
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {plans && plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {plan.custom_plan_name}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{t.startDate}: {format(new Date(plan.start_date), 'P', { locale: locales[lang] })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <Flag className="h-4 w-4" />
                          <span>{t.endDate}: {format(new Date(plan.end_date), 'P', { locale: locales[lang] })}</span>
                      </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t.progress}</p>
                    <Progress value={calculateProgress(plan)} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-3">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/${lang}/plans/${plan.id}`}>{t.viewPlan}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};