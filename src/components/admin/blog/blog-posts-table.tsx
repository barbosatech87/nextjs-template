"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deletePost } from "@/app/actions/blog";
import { Locale } from "@/lib/i18n/config";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Post = {
  id: string;
  title: string;
  status: string;
  published_at: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
};

interface BlogPostsTableProps {
  posts: Post[];
  lang: Locale;
}

const texts = {
  pt: {
    tableTitle: "Título",
    author: "Autor",
    status: "Status",
    published: "Publicado em",
    actions: "Ações",
    edit: "Editar",
    delete: "Deletar",
    deleteConfirmTitle: "Você tem certeza?",
    deleteConfirmDesc: "Essa ação não pode ser desfeita. Isso irá deletar permanentemente a postagem.",
    cancel: "Cancelar",
    continue: "Continuar",
    deleteSuccess: "Post deletado com sucesso.",
    deleteError: "Erro ao deletar o post.",
  },
  en: {
    tableTitle: "Title",
    author: "Author",
    status: "Status",
    published: "Published At",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDesc: "This action cannot be undone. This will permanently delete the post.",
    cancel: "Cancel",
    continue: "Continue",
    deleteSuccess: "Post deleted successfully.",
    deleteError: "Error deleting post.",
  },
  es: {
    tableTitle: "Título",
    author: "Autor",
    status: "Estado",
    published: "Publicado el",
    actions: "Acciones",
    edit: "Editar",
    delete: "Eliminar",
    deleteConfirmTitle: "¿Estás seguro?",
    deleteConfirmDesc: "Esta acción no se puede deshacer. Esto eliminará permanentemente la entrada.",
    cancel: "Cancelar",
    continue: "Continuar",
    deleteSuccess: "Entrada eliminada con éxito.",
    deleteError: "Error al eliminar la entrada.",
  },
};

export function BlogPostsTable({ posts, lang }: BlogPostsTableProps) {
  const [isPending, startTransition] = useTransition();
  const t = texts[lang] || texts.pt;

  const handleDelete = (postId: string) => {
    startTransition(async () => {
      const result = await deletePost(postId, lang);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        toast.error(result.message || t.deleteError);
      }
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.tableTitle}</TableHead>
              <TableHead className="hidden md:table-cell">{t.author}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.status}</TableHead>
              <TableHead className="hidden lg:table-cell">{t.published}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {post.author_first_name || 'N/A'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getStatusVariant(post.status)}>{post.status}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'N/A'}
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
                        <DropdownMenuItem asChild>
                           <Link href={`/${lang}/admin/blog/edit/${post.id}`}>{t.edit}</Link>
                        </DropdownMenuItem>
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
                          onClick={() => handleDelete(post.id)}
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
    </div>
  );
}