"use client";

import React, { useTransition } from 'react';
import { Locale } from '@/lib/i18n/config';
import ProfileFormWrapper from './profile-form-wrapper';
import PasswordChangeForm from './password-change-form';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface UserDataTabProps {
  lang: Locale;
}

const texts = {
  pt: {
    logout: "Sair da Conta",
    logoutSuccess: "Você foi desconectado com sucesso.",
    logoutError: "Erro ao sair da conta.",
    notificationsTitle: "Notificações Push",
    notificationsDesc: "Receba notificações sobre novos posts e atualizações importantes diretamente no seu dispositivo. Clique no sino para ativar ou desativar.",
  },
  en: {
    logout: "Log Out",
    logoutSuccess: "You have been successfully logged out.",
    logoutError: "Error logging out.",
    notificationsTitle: "Push Notifications",
    notificationsDesc: "Receive notifications about new posts and important updates directly on your device. Click the bell to enable or disable.",
  },
  es: {
    logout: "Cerrar Sesión",
    logoutSuccess: "Has cerrado sesión con éxito.",
    logoutError: "Error al cerrar sesión.",
    notificationsTitle: "Notificaciones Push",
    notificationsDesc: "Recibe notificaciones sobre nuevas publicaciones y actualizaciones importantes directamente en tu dispositivo. Haz clic en la campana para activar o desactivar.",
  },
};

export const UserDataTab: React.FC<UserDataTabProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(t.logoutError);
        console.error(error);
      } else {
        toast.success(t.logoutSuccess);
        router.push(`/${lang}/auth`);
      }
    });
  };

  return (
    <div className="space-y-8">
      <ProfileFormWrapper lang={lang} />
      
      <div className="border-t pt-6">
        <PasswordChangeForm lang={lang} />
      </div>

      <div className="border-t pt-6 space-y-4">
        <h2 className="text-xl font-semibold">{t.notificationsTitle}</h2>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <p className="text-sm text-muted-foreground max-w-md">
            {t.notificationsDesc}
          </p>
          <NotificationBell lang={lang} />
        </div>
      </div>

      <div className="border-t pt-6">
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          disabled={isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t.logout}
        </Button>
      </div>
    </div>
  );
};