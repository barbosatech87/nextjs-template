"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deletePage } from "@/app/actions/pages";
import { Locale } from "@/lib/i18n/config";
import { MoreHorizontal, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Page } from "@/types/supabase";

interface PagesTableProps {
  pages: Page[];
  lang: Locale;
}

const texts = {
  pt: {
    title: "Título",
    status: "Status",
    actions: "Ações",
    view: "Ver Página",
    edit: "Editar",
    delete: "Deletar",
    deleteConfirmTitle: "Você tem certeza?",
    deleteConfirmDesc: "Essa ação não pode ser desfeita. Isso irá deletar permanentemente a página.",
    cancel: "Cancelar",
    continue: "Continuar",
    deleteSuccess: "Página deletada com sucesso.",
    deleteError: "Erro ao deletar a página.",
  },
};

export function PagesTable({ pages, lang }: PagesTableProps) {
  const [isPending, startTransition] = useTransition();
  const t = texts.pt;

  const handleDelete = (pageId: string) => {
    startTransition(async () => {
      const result = await deletePage(pageId, lang);
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
            <TableHead>{t.status}</TableHead>
            <TableHead className="text-right">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell><Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge></TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {page.status === 'published' && (
                        <DropdownMenuItem asChild>
                          <Link href={`/${lang}/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            {t.view}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild><Link href={`/${lang}/admin/pages/edit/${page.id}`}>{t.edit}</Link></DropdownMenuItem>
                      <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t.delete}</DropdownMenuItem></AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(page.id)} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t.continue}</AlertDialogAction>
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