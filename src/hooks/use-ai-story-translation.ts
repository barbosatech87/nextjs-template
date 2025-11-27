"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useAIStoryTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  const triggerTranslation = useCallback(async (storyId: string, title: string, storyData: any) => {
    setIsTranslating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/translate-web-story`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ storyId, title, storyData }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro na tradução.");

      toast.success(`Tradução de Story iniciada para: ${data.languages?.join(', ')}`);
      return true;

    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Falha ao iniciar a tradução da Story.");
      return false;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { triggerTranslation, isTranslating };
}