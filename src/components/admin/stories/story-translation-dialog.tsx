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
import { useAIStoryTranslation } from '@/hooks/use-ai-story-translation';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';

interface StoryTranslationDialogProps {
  lang: Locale;
  storyId: string;
  title: string;
  storyData: any;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryTranslationDialog({ lang, storyId, title, storyData, isOpen, onClose }: StoryTranslationDialogProps) {
  const { triggerTranslation, isTranslating } = useAIStoryTranslation();
  const router = useRouter();

  const handleTranslate = async () => {
    const success = await triggerTranslation(storyId, title, storyData);
    if (success) {
      router.push(`/${lang}/admin/stories`);
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
    router.push(`/${lang}/admin/stories`);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Languages className="h-6 w-6" />
            Traduzir Web Story?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Deseja criar automaticamente as versões em Inglês e Espanhol desta Story?
            A IA irá traduzir todos os textos mantendo o layout intacto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip} disabled={isTranslating}>
            Pular
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleTranslate} disabled={isTranslating}>
            {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isTranslating ? "Traduzindo..." : "Traduzir Agora"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}