"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { urlBase64ToUint8Array } from '@/lib/utils';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Helper para aguardar o Service Worker com um timeout e tentativa de recuperação
const waitForServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  
  // Função auxiliar para timeout
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> => {
    return new Promise((resolve) => {
      promise.then(resolve).catch((e) => {
        console.error("Promise error:", e);
        resolve(null);
      });
      setTimeout(() => {
        console.warn('Timeout aguardando Service Worker.');
        resolve(null);
      }, ms);
    });
  };

  try {
    // 1. Verifica se já existe um registro ATIVO
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration && existingRegistration.active) {
      return existingRegistration;
    }

    // 2. Se não encontrou ativo, tenta registrar manualmente o arquivo gerado pelo next-pwa
    // Isso é seguro de chamar múltiplas vezes
    console.log("Registrando Service Worker manualmente...");
    await navigator.serviceWorker.register('/sw.js');

    // 3. Aguarda o evento 'ready', que resolve quando o SW está ativo
    // Aumentamos o timeout para 10s para dar tempo de download/instalação em redes móveis
    const registration = await withTimeout(navigator.serviceWorker.ready, 10000);
    
    return registration;
  } catch (error) {
    console.error('Erro crítico ao obter Service Worker:', error);
    return null;
  }
};

export function usePushNotifications(lang: Locale) {
  const { user } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const lastCheckedUserId = useRef<string | undefined>(undefined);
  
  const userId = user?.id;

  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSubscribing(false);
      return;
    }

    if (isCheckingRef.current || (userId && lastCheckedUserId.current === userId)) {
        setIsSubscribing(false);
        return;
    }

    isCheckingRef.current = true;

    try {
      // Aqui usamos um timeout menor pois é apenas uma checagem inicial de UI
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
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
      // Tenta obter ou registrar o SW
      const registration = await waitForServiceWorker();
      
      if (!registration) {
        throw new Error("Service Worker não está pronto. Recarregue a página e tente novamente.");
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
      toast.success("Notificações ativadas com sucesso!");
      lastCheckedUserId.current = user.id;
    } catch (err) {
      console.error("Failed to subscribe user:", err);
      let message = "Falha ao ativar as notificações.";
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = "Permissão negada. Verifique as configurações do navegador.";
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
        console.warn("Failed to delete from DB:", dbError);
      }

      setSubscription(null);
      setIsSubscribed(false);
      toast.success("Notificações desativadas.");
    } catch (err) {
      console.error("Failed to unsubscribe user:", err);
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