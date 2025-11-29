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
    // 1. Tenta obter um registro já existente imediatamente
    // Isso evita esperar pela promessa 'ready' se o SW já estiver registrado
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration && existingRegistration.active) {
      return existingRegistration;
    }

    // 2. Se não houver ativo, aguarda a promessa 'ready' com timeout
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        // Em produção, isso pode significar que o SW falhou ao registrar ou o navegador bloqueou
        console.warn('Service Worker check timed out.');
        resolve(null);
      }, 4000); // Aumentei um pouco para conexões lentas
    });

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
  const [isSubscribing, setIsSubscribing] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCheckingRef = useRef(false);
  const lastCheckedUserId = useRef<string | undefined>(undefined);
  
  const userId = user?.id;

  const checkSubscription = useCallback(async () => {
    // Validação inicial de ambiente
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSubscribing(false);
      return;
    }

    // Evita verificações duplicadas
    if (isCheckingRef.current || (userId && lastCheckedUserId.current === userId)) {
        setIsSubscribing(false);
        return;
    }

    isCheckingRef.current = true;

    try {
      const registration = await waitForServiceWorker();
      
      if (!registration) {
        // Se falhar ao obter o SW, apenas paramos o loading sem erro fatal
        // Isso permite que o site funcione mesmo se o PWA falhar
        setIsSubscribing(false);
        isCheckingRef.current = false;
        return;
      }

      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        // Verifica se a subscrição também existe no banco de dados
        const { data, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('subscription_data->>endpoint', sub.endpoint)
          .single();

        if (data && !error) {
          setIsSubscribed(true);
          setSubscription(sub);
        } else {
          // Inconsistência: Existe no navegador mas não no DB. Remove do navegador.
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
    
    // Verificação crítica da chave VAPID
    if (!VAPID_PUBLIC_KEY) {
      console.error("VAPID public key not found in environment variables.");
      toast.error("Configuração ausente: Chave de notificação não encontrada.");
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await waitForServiceWorker();
      if (!registration) {
        throw new Error("Service Worker não está pronto. Recarregue a página e tente novamente.");
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      // Tenta inscrever
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Salva no Supabase
      const { error: dbError } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        subscription_data: sub.toJSON(),
        language_code: lang,
      });

      if (dbError) {
        if (dbError.code === '23505') {
          // Ignora erro de duplicidade (já inscrito)
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
          message = "Você bloqueou as notificações. Ative-as nas configurações do navegador.";
        } else {
          message = `Erro: ${err.message}`;
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
        console.warn("Failed to delete from DB, but browser unsubscribed:", dbError);
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