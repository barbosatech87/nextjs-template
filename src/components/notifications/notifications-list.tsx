"use client";

import React from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsList({ lang }: { lang: "pt" | "en" | "es" }) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const texts = {
    pt: {
      title: "Notificações",
      empty: "Você não possui notificações.",
      markAll: "Marcar todas como lidas",
      justNow: "agora mesmo",
      unread: "Não lida",
    },
    en: {
      title: "Notifications",
      empty: "You have no notifications.",
      markAll: "Mark all as read",
      justNow: "just now",
      unread: "Unread",
    },
    es: {
      title: "Notificaciones",
      empty: "No tienes notificaciones.",
      markAll: "Marcar todas como leídas",
      justNow: "ahora mismo",
      unread: "No leída",
    },
  }[lang] ?? {
    title: "Notificações",
    empty: "Você não possui notificações.",
    markAll: "Marcar todas como lidas",
    justNow: "agora mesmo",
    unread: "Não lida",
  };

  return (
    <Card className="mt-10">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {texts.title}
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-5 px-2">
              {unreadCount}
            </span>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllAsRead}>
            <Check className="h-4 w-4" />
            {texts.markAll}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{texts.empty}</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-md border p-4",
                  !n.read_at && "bg-accent/30"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={cn("font-medium", !n.read_at && "text-foreground")}>
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {n.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read_at && (
                    <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}