"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/auth/session-context-provider';
import { Profile } from '@/types/supabase';
import { toast } from 'sonner';

export function useProfile() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usamos o ID do usuário como dependência principal para evitar re-renderizações
  // causadas pela instabilidade referencial do objeto 'user' completo.
  const userId = user?.id;

  const fetchProfile = useCallback(async () => {
    // Se não houver ID de usuário, limpa o perfil e para o carregamento.
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = No rows found
        throw new Error(dbError.message);
      }

      setProfile(data || null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Falha ao carregar o perfil.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Dependência apenas no ID (string primitive)

  useEffect(() => {
    // Só buscamos se a sessão terminou de carregar
    if (!isSessionLoading) {
      fetchProfile();
    }
  }, [isSessionLoading, fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'role' | 'updated_at'>>) => {
    if (!userId) {
      toast.error('Você precisa estar logado para atualizar o perfil.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      // Atualiza o estado local após o sucesso
      setProfile((prev: Profile | null) => prev ? { ...prev, ...updates } as Profile : null);
      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(`Erro ao atualizar perfil: Falha na comunicação.`);
      return false;
    }
  };

  return { profile, isLoading: isLoading || isSessionLoading, error, updateProfile, refetchProfile: fetchProfile };
}