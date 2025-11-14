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
import { BookCopy, BotMessageSquare, Image, LayoutDashboard, Users } from 'lucide-react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';

const texts = {
  pt: {
    dashboard: "Painel",
    blogPosts: "Posts do Blog",
    newPost: "Nova Postagem",
    aiPost: "Post com IA",
    aiImage: "Gerador de Imagens",
    users: "Usuários",
    title: "Admin"
  },
  en: {
    dashboard: "Dashboard",
    blogPosts: "Blog Posts",
    newPost: "New Post",
    aiPost: "AI Post",
    aiImage: "Image Generator",
    users: "Users",
    title: "Admin"
  },
  es: {
    dashboard: "Panel",
    blogPosts: "Entradas del Blog",
    newPost: "Nueva Entrada",
    aiPost: "Entrada con IA",
    aiImage: "Generador de Imágenes",
    users: "Usuarios",
    title: "Admin"
  },
};

interface AdminSidebarProps {
  lang: Locale;
  children: React.ReactNode;
}

export function AdminSidebar({ lang, children }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = texts[lang] || texts.pt;

  const menuItems = [
    { href: `/${lang}/admin`, label: t.dashboard, icon: <LayoutDashboard /> },
    { href: `/${lang}/admin/blog`, label: t.blogPosts, icon: <BookCopy /> },
    { href: `/${lang}/admin/users`, label: t.users, icon: <Users /> },
    { href: `/${lang}/admin/ai-image-generator`, label: t.aiImage, icon: <Image /> },
    { href: `/${lang}/admin/ai-writer`, label: t.aiPost, icon: <BotMessageSquare /> },
  ];

  return (
    <SidebarProvider>
      {/* Adicionando 'h-screen' e 'sticky top-0' ao Sidebar para garantir que ele seja fixo e ocupe a altura total */}
      <Sidebar className="h-screen sticky top-0">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">{t.title}</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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
        </SidebarContent>
      </Sidebar>
      {/* Removendo pt-16. O MainLayout já fornece o padding superior. */}
      <SidebarInset className="flex-1 overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}