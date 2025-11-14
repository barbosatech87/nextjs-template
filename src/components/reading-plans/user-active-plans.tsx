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
      empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um na aba 'Criar Plano'?",
      viewPlan: "Acompanhar",
      progress: "Progresso",
      dateRange: "De {start} a {end}",
    },
    en: { 
      title: "My Active Plans", 
      empty: "You don't have any active reading plans. How about starting one in the 'Create Plan' tab?",
      viewPlan: "Track",
      progress: "Progress",
      dateRange: "From {start} to {end}",
    },
    es: { 
      title: "Mis Planes Activos", 
      empty: "No tienes ningún plan de lectura activo. ¿Qué tal si empiezas uno en la pestaña 'Crear Plan'?",
      viewPlan: "Seguimiento",
      progress: "Progreso",
      dateRange: "Del {start} al {end}",
    },
  }[lang] || { 
    title: "Meus Planos Ativos", 
    empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um na aba 'Criar Plano'?",
    viewPlan: "Acompanhar",
    progress: "Progresso",
    dateRange: "De {start} a {end}",
  };

  // TODO: O cálculo do progresso será implementado no próximo passo
  const calculateProgress = (plan: UserReadingPlan) => {
    return 5; // Valor fixo por enquanto
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-muted/30">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{t.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t.empty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{plan.custom_plan_name}</CardTitle>
            <CardDescription>
              {t.dateRange
                .replace('{start}', format(new Date(plan.start_date), 'P', { locale: locales[lang] }))
                .replace('{end}', format(new Date(plan.end_date), 'P', { locale: locales[lang] }))
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">{t.progress}</span>
                <span>{calculateProgress(plan)}%</span>
              </div>
              <Progress value={calculateProgress(plan)} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={`/${lang}/plans/${plan.id}`}>{t.viewPlan}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};