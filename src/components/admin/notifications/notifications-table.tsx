"use client";

import React, { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Locale } from "@/lib/i18n/config";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteNotificationBroadcast } from "@/app/actions/notifications";

type Broadcast = {
  id: string;
  title: string;
  body: string;
  sent_to_count: number;
  created_at: string;
};

interface NotificationsTableProps {
  broadcasts: Broadcast[];
  lang: Locale;
}

const texts = {
  pt: {
    title: "Título",
    recipients: "Destinatários",
    sentAt: "Enviado em",
    actions: "Ações",
    delete: "Deletar para todos",
    deleteConfirmTitle: "Você tem certeza?",
    deleteConfirmDesc: "Essa ação não pode ser desfeita. Isso irá deletar esta notificação para todos os usuários que a receberam.",
    cancel: "Cancelar",
    continue: "Continuar",
    deleteSuccess: "Notificação deletada com sucesso.",
    deleteError: "Erro ao deletar a notificação.",
  },
};

export function NotificationsTable({ broadcasts, lang }: NotificationsTableProps) {
  const [isPending, startTransition] = useTransition();
  const t = texts.pt;

  const handleDelete = (broadcastId: string) => {
    startTransition(async () => {
      const result = await deleteNotificationBroadcast(broadcastId);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        toast.error(result.message || t.deleteError);
      }
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.title}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.recipients}</TableHead>
            <TableHead className="hidden md:table-cell">{t.sentAt}</TableHead>
            <TableHead className="text-right">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {broadcasts.map((broadcast) => (
            <TableRow key={broadcast.id}>
              <TableCell className="font-medium">{broadcast.title}</TableCell>
              <TableCell className="hidden sm:table-cell">{broadcast.sent_to_count}</TableCell>
              <TableCell className="hidden md:table-cell">
                {new Date(broadcast.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.delete}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(broadcast.id)}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t.continue}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}