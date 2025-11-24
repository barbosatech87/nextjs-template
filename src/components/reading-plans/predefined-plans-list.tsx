"use client";

import React, { useTransition } from 'react';
import { toast } from 'sonner';
import { Locale } from '@/lib/i18n/config';
import { PredefinedPlan } from '@/app/actions/reading-plans';
import { startPredefinedPlan } from '@/app/actions/plans';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Calendar, PlayCircle } from 'lucide-react';

interface PredefinedPlansListProps {
  lang: Locale;
  plans: PredefinedPlan[];
}

export const PredefinedPlansList: React.FC<PredefinedPlansListProps> = ({ lang, plans }) => {
  const [isPending, startTransition] = useTransition();
  const t = {
    pt: { 
      title: "Explorar Planos de Leitura", 
      description: "Escolha um dos nossos planos selecionados para começar sua jornada.", 
      empty: "Nenhum plano público disponível no momento.",
      startPlan: "Iniciar Plano",
      starting: "Iniciando...",
      startSuccess: "Plano iniciado com sucesso! Verifique em 'Meus Planos'.",
      startError: "Erro ao iniciar o plano.",
      books: "livros",
      days: "dias",
    },
    en: { 
      title: "Explore Reading Plans", 
      description: "Choose one of our curated plans to start your journey.", 
      empty: "No public plans available at the moment.",
      startPlan: "Start Plan",
      starting: "Starting...",
      startSuccess: "Plan started successfully! Check 'My Plans'.",
      startError: "Error starting plan.",
      books: "books",
      days: "days",
    },
    es: { 
      title: "Explorar Planes de Lectura", 
      description: "Elige uno de nuestros planes seleccionados para comenzar tu viaje.", 
      empty: "No hay planes públicos disponibles en este momento.",
      startPlan: "Iniciar Plan",
      starting: "Iniciando...",
      startSuccess: "¡Plan iniciado con éxito! Revisa en 'Mis Planes'.",
      startError: "Error al iniciar el plan.",
      books: "libros",
      days: "días",
    },
  }[lang] || { 
      title: "Explorar Planos de Leitura", 
      description: "Escolha um dos nossos planos selecionados para começar sua jornada.", 
      empty: "Nenhum plano público disponível no momento.",
      startPlan: "Iniciar Plano",
      starting: "Iniciando...",
      startSuccess: "Plano iniciado com sucesso! Verifique em 'Meus Planos'.",
      startError: "Erro ao iniciar o plano.",
      books: "livros",
      days: "dias",
  };

  const handleStartPlan = (planId: string) => {
    startTransition(async () => {
      const result = await startPredefinedPlan(planId, lang);
      if (result.success) {
        toast.success(t.startSuccess);
      } else {
        toast.error(`${t.startError}: ${result.message}`);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Book className="h-4 w-4 mr-2" />
                    <span>{plan.books.length} {t.books}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{plan.duration_days} {t.days}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleStartPlan(plan.id)}
                    disabled={isPending}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isPending ? t.starting : t.startPlan}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};