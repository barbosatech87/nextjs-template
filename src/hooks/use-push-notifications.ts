"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications(lang: Locale) {
  const { user } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(true); // Começa true para checar status inicial
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trava para evitar verificações duplicadas ou em loop
  const isCheckingRef = useRef(false);
  const lastCheckedUserId = useRef<string | undefined>(undefined);
  
  const userId = user?.id;

  const checkSubscription = useCallback(async () => {
    // Se não há suporte, usuário ou chave, aborta imediatamente
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError("Push notifications are not supported by this browser.");
      setIsSubscribing(false);
      return;
    }

    // Previne execução se já estiver rodando ou se já checou este usuário
    if (isCheckingRef.current || (userId && lastCheckedUserId.current === userId)) {
        setIsSubscribing(false);
        return;
    }

    isCheckingRef.current = true;
    // Mantemos isSubscribing true enquanto verificamos

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        // Verifica com o backend se essa inscrição ainda é válida
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('subscription_data->>endpoint', sub.endpoint)
          .single();

        if (data && !error) {
          setIsSubscribed(true);
          setSubscription(sub);
        } else {
          // Inscrição existe no navegador mas não no banco (limpeza)
          await sub.unsubscribe();
          setIsSubscribed(false);
          setSubscription(null);
        }
      } else {
        setIsSubscribed(false);
        setSubscription(null);
      }
      
      // Marca sucesso para este ID
      if (userId) lastCheckedUserId.current = userId;

    } catch (err) {
      console.error("Error checking push subscription:", err);
      setError("Failed to check subscription status.");
    } finally {
      setIsSubscribing(false);
      isCheckingRef.current = false;
    }
  }, [userId]); // Dependência estável (apenas ID)

  useEffect(() => {
    if (userId) {
      checkSubscription();
    } else {
      setIsSubscribing(false);
      setIsSubscribed(false);
      lastCheckedUserId.current = undefined; // Reseta cache se deslogar
    }
  }, [userId, checkSubscription]);

  const subscribeUser = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para ativar as notificações.");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key not found.");
      toast.error("Erro de configuração: Chave de notificação ausente.");
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const { error: dbError } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        subscription_data: sub.toJSON(),
        language_code: lang,
      });

      if (dbError) {
        if (dbError.code === '23505') { // unique_violation
          console.log("Subscription already exists on the server.");
        } else {
          throw new Error(dbError.message);
        }
      }

      setSubscription(sub);
      setIsSubscribed(true);
      toast.success("Notificações ativadas!");
      // Atualiza o cache para evitar re-check desnecessário
      lastCheckedUserId.current = user.id;
    } catch (err) {
      console.error("Failed to subscribe user:", err);
      let message = "Falha ao ativar as notificações.";
      if (err instanceof Error && err.name === 'NotAllowedError') {
        message = "Permissão para notificações foi negada.";
      }
      setError(message);
      toast.error(message);
      setIsSubscribed(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeUser = async () => {
    if (!subscription) return;

    setIsSubscribing(true);
    setError(null);

    try {
      await subscription.unsubscribe();

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('subscription_data->>endpoint', subscription.endpoint);

      if (dbError) {
        console.warn("Failed to delete subscription from DB, but unsubscribed from browser:", dbError);
      }

      setSubscription(null);
      setIsSubscribed(false);
      toast.success("Notificações desativadas.");
    } catch (err) {
      console.error("Failed to unsubscribe user:", err);
      setError("Falha ao desativar as notificações.");
      toast.error("Falha ao desativar as notificações.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    isSubscribed,
    isSubscribing,
    subscribeUser,
    unsubscribeUser,
    error,
  };
}