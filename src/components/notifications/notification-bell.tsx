"use client";

import React, { useState, useTransition } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from '@/components/auth/session-context-provider';
import { useProfile } from '@/hooks/use-profile';
import { Locale } from '@/lib/i18n/config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationPrompt } from './notification-prompt';
import { markNotificationPromptAsSeen } from '@/app/actions/users';
import { toast } from 'sonner';

export function NotificationBell({ lang }: { lang: Locale }) {
  const { user } = useSession();
  const { profile, isLoading: isProfileLoading, refetchProfile } = useProfile();
  const { isSubscribed, isSubscribing, subscribeUser, unsubscribeUser, error } = usePushNotifications(lang);
  const [isServerActionPending, startTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleMarkAsSeen = () => {
    startTransition(async () => {
      await markNotificationPromptAsSeen();
      refetchProfile(); // Força a atualização do estado do perfil no cliente
    });
  };

  const handleActivate = () => {
    subscribeUser();
    handleMarkAsSeen();
    setIsDropdownOpen(false);
  };

  const handleDismiss = () => {
    handleMarkAsSeen();
    setIsDropdownOpen(false);
    toast.info("Ok, não perguntaremos novamente.");
  };

  const isLoading = isProfileLoading || isSubscribing || isServerActionPending;

  // Determina o estado do sino
  const showPromptIndicator = !isSubscribed && profile && !profile.has_seen_notification_prompt;
  const showBellOff = !isSubscribed && profile && profile.has_seen_notification_prompt;

  const getTooltipText = () => {
    if (isLoading) return "Carregando...";
    if (error) return `Erro: ${error}`;
    if (showPromptIndicator) return "Ative as notificações para não perder novidades!";
    if (isSubscribed) return "Desativar notificações push";
    return "Ativar notificações push";
  };

  const renderIcon = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (isSubscribed) return <Bell className="h-5 w-5 text-primary" />;
    if (showBellOff) return <BellOff className="h-5 w-5 text-muted-foreground" />;
    
    // Estado padrão e com indicador
    return (
      <div className="relative">
        <Bell className="h-5 w-5" />
        {showPromptIndicator && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </div>
    );
  };

  // Se o usuário já está inscrito, o sino tem uma função simples de ligar/desligar
  if (isSubscribed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={unsubscribeUser} disabled={isLoading}>
              {renderIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{getTooltipText()}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Se não está inscrito, o sino abre o menu de prompt
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isLoading}>
                {renderIcon()}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent><p>{getTooltipText()}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <NotificationPrompt 
          lang={lang}
          onActivate={handleActivate}
          onDismiss={handleDismiss}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}