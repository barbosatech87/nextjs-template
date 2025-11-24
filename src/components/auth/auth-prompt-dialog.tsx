"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Locale } from '@/lib/i18n/config';
import { LogIn } from 'lucide-react';

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lang: Locale;
}

const texts = {
  pt: {
    title: "Recurso para Membros",
    description: "Para salvar anotações e versículos favoritos, você precisa estar logado. Crie uma conta ou faça login para continuar.",
    cancel: "Cancelar",
    confirm: "Login / Cadastro",
  },
  en: {
    title: "Members Feature",
    description: "To save notes and favorite verses, you need to be logged in. Create an account or log in to continue.",
    cancel: "Cancel",
    confirm: "Login / Register",
  },
  es: {
    title: "Función para Miembros",
    description: "Para guardar notas y versículos favoritos, necesitas iniciar sesión. Crea una cuenta o inicia sesión para continuar.",
    cancel: "Cancelar",
    confirm: "Iniciar Sesión / Registrarse",
  },
};

export const AuthPromptDialog: React.FC<AuthPromptDialogProps> = ({ open, onOpenChange, onConfirm, lang }) => {
  const t = texts[lang] || texts.pt;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            <LogIn className="mr-2 h-4 w-4" />
            {t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};