"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserActivePlansProps {
  lang: Locale;
}

export const UserActivePlans: React.FC<UserActivePlansProps> = ({ lang }) => {
  const t = {
    pt: { title: "Meus Planos Ativos", empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um?" },
    en: { title: "My Active Plans", empty: "You don't have any active reading plans. How about starting one?" },
    es: { title: "Mis Planes Activos", empty: "No tienes ningún plan de lectura activo. ¿Qué tal si empiezas uno?" },
  }[lang] || { title: "Meus Planos Ativos", empty: "Você não tem nenhum plano de leitura ativo. Que tal começar um?" };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        </div>
        {/* TODO: Implementar a listagem dos planos do usuário */}
      </CardContent>
    </Card>
  );
};