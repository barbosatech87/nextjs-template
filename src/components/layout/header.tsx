"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/auth/session-context-provider';
import { Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Brain, Calendar, Rss, Shield, LogOut, Bell, Menu, Download, GalleryThumbnails } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useProfile } from '@/hooks/use-profile';
import { useNotifications } from '@/hooks/use-notifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { NotificationBell } from '@/components/notifications/notification-bell';

interface HeaderProps {
  lang: Locale;
}

const navTexts = {
  pt: {
    bible: "Ler Bíblia",
    iaExplica: "IA Explica",
    plans: "Planos de Leitura",
    blog: "Blog",
    webStories: "Stories",
    login: "Login / Cadastro",
    appName: "PaxWord",
    admin: "Painel Admin",
    profile: "Perfil",
    logout: "Sair",
    logoutSuccess: "Você foi desconectado com sucesso.",
    logoutError: "Erro ao sair da conta.",
    install: "Instalar App",
  },
  en: {
    bible: "Read Bible",
    iaExplica: "AI Explains",
    plans: "Reading Plans",
    blog: "Blog",
    webStories: "Stories",
    login: "Login / Register",
    appName: "PaxWord",
    admin: "Admin Panel",
    profile: "Profile",
    logout: "Log Out",
    logoutSuccess: "You have been successfully logged out.",
    logoutError: "Error logging out.",
    install: "Install App",
  },
  es: {
    bible: "Leer Biblia",
    iaExplica: "IA Explica",
    plans: "Planes de Lectura",
    blog: "Blog",
    webStories: "Stories",
    login: "Iniciar Sesión / Registro",
    appName: "PaxWord",
    admin: "Panel de Admin",
    profile: "Perfil",
    logout: "Cerrar Sesión",
    logoutSuccess: "Has cerrado sesión con éxito.",
    logoutError: "Error al cerrar sesión.",
    install: "Instalar App",
  },
};

const Header: React.FC<HeaderProps> = ({ lang }) => {
  const { user, isLoading } = useSession();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const [isInstallable, handleInstall] = useInstallPrompt();
  const texts = navTexts[lang] || navTexts.pt;
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { href: `/${lang}/web-stories`, label: texts.webStories, icon: GalleryThumbnails },
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
                "text-sm font-medium transition-colors hover:text-primary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth / Perfil e Menu Mobile */}
        <div className="flex items-center space-x-2">
          {isInstallable && (
            <Button variant="outline" size="sm" onClick={handleInstall} className="hidden md:inline-flex">
              <Download className="mr-2 h-4 w-4" />
              {texts.install}
            </Button>
          )}
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <>
              <NotificationBell />
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
                  {(profile?.role === 'admin' || profile?.role === 'writer') && (
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
            </>
          ) : (
            <Link href={`/${lang}/auth`}>
              <Button variant="default" size="sm">
                {texts.login}
              </Button>
            </Link>
          )}
          <LanguageSwitcher lang={lang} />

          {/* Menu Mobile */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={`/${lang}`} className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <BookOpen className="h-6 w-6 text-primary" />
                      <span className="font-bold text-lg">{texts.appName}</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2 py-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center rounded-md p-3 text-base font-medium hover:bg-accent"
                    >
                      <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                      {item.label}
                    </Link>
                  ))}
                  {isInstallable && (
                    <button
                      onClick={() => {
                        handleInstall();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center rounded-md p-3 text-base font-medium hover:bg-accent text-left"
                    >
                      <Download className="mr-3 h-5 w-5 text-muted-foreground" />
                      {texts.install}
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;