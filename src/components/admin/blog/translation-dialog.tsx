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
import { Button } from '@/components/ui/button';
import { Loader2, Languages } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { useAITranslation } from '@/hooks/use-ai-translation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PostContent {
  title: string;
  summary: string | null;
  content: string;
}

interface TranslationDialogProps {
  lang: Locale;
  postId: string;
  postContent: PostContent;
  isOpen: boolean;
  onClose: () => void;
}

const texts = {
  pt: {
    title: "Tradução Automática",
    description: "Deseja enviar esta nova postagem para tradução automática (Inglês e Espanhol) usando a IA?",
    translate: "Sim, Traduzir Agora",
    skip: "Não, Pular",
    translating: "Traduzindo...",
    success: "Tradução iniciada com sucesso!",
    error: "Erro ao iniciar a tradução.",
  },
  en: {
    title: "Automatic Translation",
    description: "Do you want to send this new post for automatic translation (English and Spanish) using AI?",
    translate: "Yes, Translate Now",
    skip: "No, Skip",
    translating: "Translating...",
    success: "Translation started successfully!",
    error: "Error starting translation.",
  },
  es: {
    title: "Traducción Automática",
    description: "¿Desea enviar esta nueva entrada para traducción automática (Inglés y Portugués) usando IA?",
    translate: "Sí, Traducir Ahora",
    skip: "No, Omitir",
    translating: "Traduciendo...",
    success: "¡Traducción iniciada con éxito!",
    error: "Error al iniciar la traducción.",
  },
};

export function TranslationDialog({ lang, postId, postContent, isOpen, onClose }: TranslationDialogProps) {
  const t = texts[lang] || texts.pt;
  const { triggerTranslation, isTranslating } = useAITranslation();
  const router = useRouter();

  const handleTranslate = async () => {
    const success = await triggerTranslation(postId, postContent);
    if (success) {
      toast.success(t.success);
      router.push(`/${lang}/admin/blog`);
    } else {
      toast.error(t.error);
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
    router.push(`/${lang}/admin/blog`);
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
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.translating}
              </>
            ) : (
              t.translate
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}