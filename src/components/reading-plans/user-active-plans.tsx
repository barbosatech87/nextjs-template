"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Locale } from '@/lib/i18n/config';
import { UserReadingPlan } from '@/types/supabase';
import { deleteUserReadingPlan } from '@/app/actions/plans';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserActivePlansProps {
  lang: Locale;
  plans: UserReadingPlan[];
}

const locales = { pt: ptBR, en: enUS, es: es };

export const UserActivePlans: React.FC<UserActivePlansProps> = ({ lang, plans }) => {
  const [isPending, startTransition] = useTransition();
  const t = {
    pt: { 
      title: "Meus Planos Ativos", 
      empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um na aba 'Criar Plano'?",
      viewPlan: "Acompanhar",
      progress: "Progresso",
      dateRange: "De {start} a {end}",
      deleteTitle: "Você tem certeza?",
      deleteDescription: "Esta ação não pode ser desfeita. Isso excluirá permanentemente seu plano de leitura e todo o progresso associado.",
      deleteConfirm: "Confirmar",
      deleteCancel: "Cancelar",
      deleteSuccess: "Plano excluído com sucesso!",
      deleteError: "Erro ao excluir o plano.",
    },
    en: { 
      title: "My Active Plans", 
      empty: "You don't have any active reading plans. How about starting one in the 'Create Plan' tab?",
      viewPlan: "Track",
      progress: "Progress",
      dateRange: "From {start} to {end}",
      deleteTitle: "Are you sure?",
      deleteDescription: "This action cannot be undone. This will permanently delete your reading plan and all associated progress.",
      deleteConfirm: "Confirm",
      deleteCancel: "Cancel",
      deleteSuccess: "Plan deleted successfully!",
      deleteError: "Error deleting plan.",
    },
    es: { 
      title: "Mis Planes Activos", 
      empty: "No tienes ningún plan de lectura activo. ¿Qué tal si empiezas uno en la pestaña 'Crear Plan'?",
      viewPlan: "Seguimiento",
      progress: "Progreso",
      dateRange: "Del {start} al {end}",
      deleteTitle: "¿Estás seguro?",
      deleteDescription: "Esta acción no se puede deshacer. Esto eliminará permanentemente tu plan de lectura y todo el progreso asociado.",
      deleteConfirm: "Confirmar",
      deleteCancel: "Cancelar",
      deleteSuccess: "¡Plan eliminado con éxito!",
      deleteError: "Error al eliminar el plan.",
    },
  }[lang] || { 
      title: "Meus Planos Ativos", 
      empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um na aba 'Criar Plano'?",
      viewPlan: "Acompanhar",
      progress: "Progresso",
      dateRange: "De {start} a {end}",
      deleteTitle: "Você tem certeza?",
      deleteDescription: "Esta ação não pode ser desfeita. Isso excluirá permanentemente seu plano de leitura e todo o progresso associado.",
      deleteConfirm: "Confirmar",
      deleteCancel: "Cancelar",
      deleteSuccess: "Plano excluído com sucesso!",
      deleteError: "Erro ao excluir o plano.",
  };

  const handleDelete = (planId: string) => {
    startTransition(async () => {
      const result = await deleteUserReadingPlan(planId, lang);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        toast.error(t.deleteError);
      }
    });
  };

  const calculateProgress = (plan: UserReadingPlan) => {
    return 5; // TODO: Implementar cálculo real do progresso
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
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{plan.custom_plan_name}</CardTitle>
                <CardDescription>
                  {t.dateRange
                    .replace('{start}', format(new Date(plan.start_date), 'P', { locale: locales[lang] }))
                    .replace('{end}', format(new Date(plan.end_date), 'P', { locale: locales[lang] }))
                  }
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.deleteCancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(plan.id)} disabled={isPending}>
                      {t.deleteConfirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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