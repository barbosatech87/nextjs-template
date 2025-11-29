"use client";

import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';

export function NotificationBell({ lang }: { lang: Locale }) {
  const { user } = useSession();
  const { isSubscribed, isSubscribing, subscribeUser, unsubscribeUser, error } = usePushNotifications(lang);

  if (!user) {
    return null; // Don't show the bell if the user is not logged in
  }

  const handleClick = () => {
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  };

  const getTooltipText = () => {
    if (isSubscribing) return "Verificando status...";
    if (error) return `Erro: ${error}`;
    return isSubscribed ? "Desativar notificações push" : "Ativar notificações push";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleClick} disabled={isSubscribing}>
            {isSubscribing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}