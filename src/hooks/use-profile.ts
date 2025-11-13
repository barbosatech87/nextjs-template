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

  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw new Error(error.message);
      }

      setProfile(data || null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Falha ao carregar o perfil.');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchProfile(user.id);
    } else if (!isSessionLoading && !user) {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, isSessionLoading, fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'role' | 'updated_at'>>) => {
    if (!user) {
      toast.error('Você precisa estar logado para atualizar o perfil.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

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

  return { profile, isLoading: isLoading || isSessionLoading, error, updateProfile, refetchProfile: () => user && fetchProfile(user.id) };
}