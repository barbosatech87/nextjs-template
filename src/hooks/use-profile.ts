"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/auth/session-context-provider';
import { Profile } from '@/types/supabase';
import { toast } from 'sonner';

export function useProfile() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs para controlar o estado da requisição sem causar re-renderizações
  const lastFetchedUserId = useRef<string | undefined>(undefined);
  const isFetching = useRef(false);

  // Usamos o ID do usuário como dependência
  const userId = user?.id;

  const fetchProfile = useCallback(async (force = false) => {
    // Se não houver usuário, reseta e para.
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      lastFetchedUserId.current = undefined;
      return;
    }

    // TRAVA DE SEGURANÇA:
    // Se já buscamos este usuário (e não é forçado) ou se já estamos buscando, aborta.
    if (!force && (lastFetchedUserId.current === userId || isFetching.current)) {
      // Se já temos o perfil carregado, garante que loading é falso
      if (lastFetchedUserId.current === userId) setIsLoading(false);
      return;
    }

    isFetching.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        throw new Error(dbError.message);
      }

      setProfile(data || null);
      lastFetchedUserId.current = userId; // Marca este ID como "sucesso"
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Falha ao carregar o perfil.');
      // Em caso de erro, não salvamos o ID no ref para permitir nova tentativa futura se necessário,
      // mas o isFetching será liberado abaixo.
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Só tenta buscar se a sessão já carregou
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

      setProfile((prev: Profile | null) => prev ? { ...prev, ...updates } as Profile : null);
      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(`Erro ao atualizar perfil: Falha na comunicação.`);
      return false;
    }
  };

  return { 
    profile, 
    isLoading: isLoading || isSessionLoading, 
    error, 
    updateProfile, 
    refetchProfile: () => fetchProfile(true) // Permite forçar atualização
  };
}