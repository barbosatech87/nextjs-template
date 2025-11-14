"use client";

import React from 'react';
import { Locale } from '@/lib/i18n/config';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NotesTabProps {
  lang: Locale;
}

const texts = {
  pt: {
    title: "Minhas Anotações",
    description: "Suas anotações pessoais sobre os versículos aparecerão aqui.",
    comingSoon: "Em breve, você poderá adicionar anotações aos versículos bíblicos!",
  },
  en: {
    title: "My Notes",
    description: "Your personal notes on verses will appear here.",
    comingSoon: "Soon, you will be able to add notes to Bible verses!",
  },
  es: {
    title: "Mis Anotaciones",
    description: "Tus notas personales sobre los versículos aparecerán aquí.",
    comingSoon: "¡Pronto podrás añadir notas a los versículos de la Biblia!",
  },
};

export const NotesTab: React.FC<NotesTabProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{t.description}</p>
        <div className="text-center py-10 border rounded-lg bg-muted/50">
          <p className="text-lg font-semibold text-primary">{t.comingSoon}</p>
        </div>
      </CardContent>
    </Card>
  );
};