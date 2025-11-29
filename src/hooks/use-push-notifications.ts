"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Helper para aguardar o Service Worker com um timeout de segurança
const waitForServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    // Cria uma promessa que resolve como null após 3 segundos
    // Isso evita que a UI fique travada se o SW não estiver ativo (comum em dev)
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('Service Worker check timed out (likely in development mode or SW disabled).');
        resolve(null);
      }, 3000);
    });

    // Corrida entre o SW ficar pronto e o timeout
    return await Promise.race([
      navigator.serviceWorker.ready,
      timeoutPromise
    ]);
  } catch (error) {
    console.error('Erro ao aguardar Service Worker:', error);
    return null;
  }
};

export function usePushNotifications(lang: Locale) {
  const { user } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(true); // Inicia carregando para verificar estado
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const lastCheckedUserId = useRef<string | undefined>(undefined);
  
  const userId = user?.id;

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // Falha silenciosa ou aviso discreto, não bloqueante
      // setError("Notificações não suportadas."); 
      setIsSubscribing(false);
      return;
    }

    if (isCheckingRef.current || (userId && lastCheckedUserId.current === userId)) {
        setIsSubscribing(false);
        return;
    }

    isCheckingRef.current = true;

    try {
      const registration = await waitForServiceWorker();
      
      if (!registration) {
        // Se retornou null (timeout ou erro), paramos o loading
        setIsSubscribing(false);
        isCheckingRef.current = false;
        return;
      }

      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('subscription_data->>endpoint', sub.endpoint)
          .single();

        if (data && !error) {
          setIsSubscribed(true);
          setSubscription(sub);
        } else {
          // Inscrição existe no browser mas não no banco
          // Tentamos remover do browser para limpar estado
          await sub.unsubscribe().catch(console.error);
          setIsSubscribed(false);
          setSubscription(null);
        }
      } else {
        setIsSubscribed(false);
        setSubscription(null);
      }
      
      if (userId) lastCheckedUserId.current = userId;

    } catch (err) {
      console.error("Error checking push subscription:", err);
      // Não definimos erro fatal aqui para não quebrar a UI, apenas logamos
    } finally {
      setIsSubscribing(false);
      isCheckingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      checkSubscription();
    } else {
      setIsSubscribing(false);
      setIsSubscribed(false);
      lastCheckedUserId.current = undefined;
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
      const registration = await waitForServiceWorker();
      if (!registration) {
        throw new Error("Service Worker não disponível. Tente recarregar a página.");
      }

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
        if (dbError.code === '23505') {
          console.log("Subscription already exists on the server.");
        } else {
          throw new Error(dbError.message);
        }
      }

      setSubscription(sub);
      setIsSubscribed(true);
      toast.success("Notificações ativadas!");
      lastCheckedUserId.current = user.id;
    } catch (err) {
      console.error("Failed to subscribe user:", err);
      let message = "Falha ao ativar as notificações.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = "Permissão para notificações foi negada pelo navegador.";
        } else {
          message = err.message;
        }
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