"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PredefinedPlansListProps {
  lang: Locale;
}

export const PredefinedPlansList: React.FC<PredefinedPlansListProps> = ({ lang }) => {
  const t = {
    pt: { title: "Explorar Planos de Leitura", description: "Escolha um dos nossos planos selecionados para começar sua jornada.", empty: "Nenhum plano público disponível no momento. O administrador pode adicionar novos planos." },
    en: { title: "Explore Reading Plans", description: "Choose one of our curated plans to start your journey.", empty: "No public plans available at the moment. The administrator can add new plans." },
    es: { title: "Explorar Planes de Lectura", description: "Elige uno de nuestros planes seleccionados para comenzar tu viaje.", empty: "No hay planes públicos disponibles en este momento. El administrador puede agregar nuevos planes." },
  }[lang] || { title: "Explorar Planos de Leitura", description: "Escolha um dos nossos planos selecionados para começar sua jornada.", empty: "Nenhum plano público disponível no momento. O administrador pode adicionar novos planos." };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        </div>
        {/* TODO: Implementar a listagem de planos pré-definidos */}
      </CardContent>
    </Card>
  );
};