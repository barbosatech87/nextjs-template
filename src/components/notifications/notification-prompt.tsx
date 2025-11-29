"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BellRing, X } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface NotificationPromptProps {
  lang: Locale;
  onActivate: () => void;
  onDismiss: () => void;
}

const texts = {
  pt: {
    title: "Ativar Notificações?",
    description: "Receba um aviso sempre que um novo post for publicado e não perca nenhuma novidade.",
    activate: "Ativar",
    dismiss: "Agora não",
  },
  en: {
    title: "Enable Notifications?",
    description: "Get notified whenever a new post is published and never miss an update.",
    activate: "Enable",
    dismiss: "Not now",
  },
  es: {
    title: "¿Activar Notificaciones?",
    description: "Recibe un aviso cada vez que se publique una nueva entrada y no te pierdas ninguna novedad.",
    activate: "Activar",
    dismiss: "Ahora no",
  },
};

export function NotificationPrompt({ lang, onActivate, onDismiss }: NotificationPromptProps) {
  const t = texts[lang] || texts.pt;

  return (
    <div className="p-2 w-64">
      <DropdownMenuLabel className="font-semibold text-base flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        {t.title}
      </DropdownMenuLabel>
      <p className="text-sm text-muted-foreground px-2 py-1">{t.description}</p>
      <DropdownMenuSeparator />
      <div className="flex justify-end gap-2 p-2">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          <X className="h-4 w-4 mr-1" />
          {t.dismiss}
        </Button>
        <Button size="sm" onClick={onActivate}>
          {t.activate}
        </Button>
      </div>
    </div>
  );
}