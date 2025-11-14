"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreatePlanFormProps {
  lang: Locale;
}

export const CreatePlanForm: React.FC<CreatePlanFormProps> = ({ lang }) => {
  const t = {
    pt: { title: "Criar Plano de Leitura Personalizado", description: "Escolha os livros, defina o prazo e nós montamos o plano para você.", comingSoon: "Em breve: Crie seu próprio plano de leitura!" },
    en: { title: "Create Custom Reading Plan", description: "Choose the books, set the deadline, and we'll build the plan for you.", comingSoon: "Coming Soon: Create your own reading plan!" },
    es: { title: "Crear Plan de Lectura Personalizado", description: "Elige los libros, establece el plazo y nosotros creamos el plan para ti.", comingSoon: "Próximamente: ¡Crea tu propio plan de lectura!" },
  }[lang] || { title: "Criar Plano de Leitura Personalizado", description: "Escolha os livros, defina o prazo e nós montamos o plano para você.", comingSoon: "Em breve: Crie seu próprio plano de leitura!" };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-lg font-semibold text-primary">{t.comingSoon}</p>
        </div>
        {/* TODO: Implementar o formulário de criação de plano */}
      </CardContent>
    </Card>
  );
};