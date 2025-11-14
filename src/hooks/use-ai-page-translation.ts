"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  title: string;
  summary: string | null;
  content: string;
}

export function useAIPageTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const triggerTranslation = useCallback(async (pageId: string, pageContent: PageContent) => {
    setIsTranslating(true);
    setTranslationError(null);

    try {
      const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/translate-page`;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("User session not found. Cannot trigger translation.");
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          pageId,
          ...pageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger translation function.");
      }

      toast.success(`Tradução iniciada com sucesso para: ${data.successful.join(', ')}.`);
      return true;

    } catch (error) {
      console.error("Translation trigger error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during translation.";
      setTranslationError(errorMessage);
      toast.error(`Falha ao iniciar a tradução: ${errorMessage}`);
      return false;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { triggerTranslation, isTranslating, translationError };
}