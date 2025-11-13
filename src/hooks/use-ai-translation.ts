"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PostContent {
  title: string;
  summary: string | null;
  content: string;
}

export function useAITranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const triggerTranslation = useCallback(async (postId: string, postContent: PostContent) => {
    setIsTranslating(true);
    setTranslationError(null);

    try {
      // O URL da Edge Function deve ser construído com o ID do projeto
      const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/translate-blog-post`;
      
      // Obtém o token de sessão atual para autenticar a chamada da Edge Function
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
          postId,
          ...postContent,
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
      setTranslationError(error instanceof Error ? error.message : "An unknown error occurred during translation.");
      toast.error("Falha ao iniciar a tradução automática.");
      return false;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { triggerTranslation, isTranslating, translationError };
}