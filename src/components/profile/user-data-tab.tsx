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

interface UserDataTabProps {
  lang: Locale;
}

const texts = {
  pt: {
    logout: "Sair da Conta",
    logoutSuccess: "Você foi desconectado com sucesso.",
    logoutError: "Erro ao sair da conta.",
  },
  en: {
    logout: "Log Out",
    logoutSuccess: "You have been successfully logged out.",
    logoutError: "Error logging out.",
  },
  es: {
    logout: "Cerrar Sesión",
    logoutSuccess: "Has cerrado sesión con éxito.",
    logoutError: "Error al cerrar sesión.",
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