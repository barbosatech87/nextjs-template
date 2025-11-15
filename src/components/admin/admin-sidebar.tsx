"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { BookCopy, BotMessageSquare, Image, LayoutDashboard, Users, Bell, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton } from '@/components/ui/skeleton';

const texts = {
  pt: {
    dashboard: "Painel",
    blogPosts: "Posts do Blog",
    pages: "Páginas",
    aiPost: "Post com IA",
    aiImage: "Gerador de Imagens",
    users: "Usuários",
    notifications: "Notificações",
    schedules: "Agendamentos",
    title: "Admin"
  },
  en: {
    dashboard: "Dashboard",
    blogPosts: "Blog Posts",
    pages: "Pages",
    aiPost: "AI Post",
    aiImage: "Image Generator",
    users: "Users",
    notifications: "Notifications",
    schedules: "Schedules",
    title: "Admin"
  },
  es: {
    dashboard: "Panel",
    blogPosts: "Entradas del Blog",
    pages: "Páginas",
    aiPost: "Entrada con IA",
    aiImage: "Generador de Imágenes",
    users: "Usuarios",
    notifications: "Notificaciones",
    schedules: "Horarios",
    title: "Admin"
  },
};

interface AdminSidebarProps {
  lang: Locale;
  children: React.ReactNode;
}

export function AdminSidebar({ lang, children }: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile, isLoading } = useProfile();
  const t = texts[lang] || texts.pt;

  const adminMenuItems = [
    { href: `/${lang}/admin`, label: t.dashboard, icon: <LayoutDashboard /> },
    { href: `/${lang}/admin/blog`, label: t.blogPosts, icon: <BookCopy /> },
    { href: `/${lang}/admin/ai-writer`, label: t.aiPost, icon: <BotMessageSquare /> },
    { href: `/${lang}/admin/ai-image-generator`, label: t.aiImage, icon: <Image /> },
    { href: `/${lang}/admin/pages`, label: t.pages, icon: <FileText /> },
    { href: `/${lang}/admin/schedules`, label: t.schedules, icon: <Clock /> },
    { href: `/${lang}/admin/users`, label: t.users, icon: <Users /> },
    { href: `/${lang}/admin/notifications`, label: t.notifications, icon: <Bell /> },
  ];

  const writerMenuItems = [
    { href: `/${lang}/admin`, label: t.dashboard, icon: <LayoutDashboard /> },
    { href: `/${lang}/admin/blog`, label: t.blogPosts, icon: <BookCopy /> },
    { href: `/${lang}/admin/ai-writer`, label: t.aiPost, icon: <BotMessageSquare /> },
    { href: `/${lang}/admin/ai-image-generator`, label: t.aiImage, icon: <Image /> },
  ];

  const menuItems = profile?.role === 'admin' ? adminMenuItems : writerMenuItems;

  const renderMenu = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      );
    }
    return (
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== `/${lang}/admin` || pathname === `/${lang}/admin`)}
                tooltip={item.label}
              >
                <span>
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  };

  return (
    <SidebarProvider>
      <Sidebar className="h-screen sticky top-0">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">{t.title}</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {renderMenu()}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex-1 overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}