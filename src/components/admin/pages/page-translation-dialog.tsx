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
import { Loader2, Languages } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { useAIPageTranslation } from '@/hooks/use-ai-page-translation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PageContent {
  title: string;
  summary: string | null;
  content: string;
}

interface PageTranslationDialogProps {
  lang: Locale;
  pageId: string;
  pageContent: PageContent;
  isOpen: boolean;
  onClose: () => void;
}

const texts = {
  pt: {
    title: "Tradução Automática de Página",
    description: "Deseja enviar esta página para tradução automática (Inglês e Espanhol) usando a IA?",
    translate: "Sim, Traduzir Agora",
    skip: "Não, Pular",
    translating: "Traduzindo...",
  },
};

export function PageTranslationDialog({ lang, pageId, pageContent, isOpen, onClose }: PageTranslationDialogProps) {
  const t = texts.pt;
  const { triggerTranslation, isTranslating } = useAIPageTranslation();
  const router = useRouter();

  const handleTranslate = async () => {
    const success = await triggerTranslation(pageId, pageContent);
    if (success) {
      toast.success("Processo de tradução iniciado.");
    }
    // Independentemente do sucesso, redireciona
    router.push(`/${lang}/admin/pages`);
    onClose();
  };

  const handleSkip = () => {
    onClose();
    router.push(`/${lang}/admin/pages`);
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6" />
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip} disabled={isTranslating}>
            {t.skip}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleTranslate} 
            disabled={isTranslating}
          >
            {isTranslating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.translating}</>
            ) : (
              t.translate
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}