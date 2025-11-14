"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Brain, Calendar, Rss, Shield, LogOut, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useProfile } from '@/hooks/use-profile';
import { useNotifications } from '@/hooks/use-notifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface HeaderProps {
  lang: Locale;
}

// Simulação de textos de navegação (será substituído por um sistema i18n completo depois)
const navTexts = {
  pt: {
    bible: "Ler Bíblia",
    iaExplica: "IA Explica",
    plans: "Planos de Leitura",
    blog: "Blog",
    login: "Login / Cadastro",
    appName: "PaxWord",
    admin: "Painel Admin",
    profile: "Perfil",
    logout: "Sair",
    logoutSuccess: "Você foi desconectado com sucesso.",
    logoutError: "Erro ao sair da conta.",
  },
  en: {
    bible: "Read Bible",
    iaExplica: "AI Explains",
    plans: "Reading Plans",
    blog: "Blog",
    login: "Login / Register",
    appName: "PaxWord",
    admin: "Admin Panel",
    profile: "Profile",
    logout: "Log Out",
    logoutSuccess: "You have been successfully logged out.",
    logoutError: "Error logging out.",
  },
  es: {
    bible: "Leer Biblia",
    iaExplica: "IA Explica",
    plans: "Planes de Lectura",
    blog: "Blog",
    login: "Iniciar Sesión / Registro",
    appName: "PaxWord",
    admin: "Panel de Admin",
    profile: "Perfil",
    logout: "Cerrar Sesión",
    logoutSuccess: "Has cerrado sesión con éxito.",
    logoutError: "Error al cerrar sesión.",
  },
};

const Header: React.FC<HeaderProps> = ({ lang }) => {
  const { user, isLoading } = useSession();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const texts = navTexts[lang] || navTexts.pt;
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(texts.logoutError);
      console.error(error);
    } else {
      toast.success(texts.logoutSuccess);
      router.push(`/${lang}/auth`);
    }
  };

  const navItems = [
    { href: `/${lang}/bible`, label: texts.bible, icon: BookOpen },
    { href: `/${lang}/ia-explica`, label: texts.iaExplica, icon: Brain },
    { href: `/${lang}/plans`, label: texts.plans, icon: Calendar },
    { href: `/${lang}/blog`, label: texts.blog, icon: Rss },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo e Nome */}
        <Link href={`/${lang}`} className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{texts.appName}</span>
        </Link>

        {/* Navegação Principal (Desktop) */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth / Perfil */}
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={texts.profile} className="relative">
                  <User className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} unread notifications`}
                      className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium h-4 min-w-4 px-1"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${lang}/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    {texts.profile}
                  </Link>
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${lang}/admin`}>
                      <Shield className="mr-2 h-4 w-4" />
                      {texts.admin}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {texts.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${lang}/auth`}>
              <Button variant="default" size="sm">
                {texts.login}
              </Button>
            </Link>
          )}
          <LanguageSwitcher lang={lang} />
        </div>
      </div>
    </header>
  );
};

export default Header;