"use client";

import React, { useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { deleteStoryAutomation, StoryAutomation, triggerStoryAutomationManually } from "@/app/actions/stories";
import { Locale } from "@/lib/i18n/config";
import { MoreHorizontal, Trash2, Edit, Play } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AutomationFormDialog } from "./automation-form-dialog";

interface AutomationsTableProps {
  automations: StoryAutomation[];
  lang: Locale;
}

export function AutomationsTable({ automations, lang }: AutomationsTableProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTriggering, startTriggerTransition] = useTransition();

  const handleDelete = (id: string) => {
    startDeleteTransition(async () => {
      const result = await deleteStoryAutomation(id, lang);
      toast[result.success ? 'success' : 'error'](result.message);
    });
  };

  const handleRunNow = (id: string) => {
    startTriggerTransition(async () => {
      toast.info("Iniciando geração manual de Story...");
      const result = await triggerStoryAutomationManually(id, lang);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {automations.map((automation) => (
            <TableRow key={automation.id}>
              <TableCell className="font-medium">{automation.name}</TableCell>
              <TableCell><code>{automation.frequency_cron_expression}</code></TableCell>
              <TableCell>
                <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                  {automation.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AutomationFormDialog lang={lang} initialData={automation}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                      </AutomationFormDialog>
                      <DropdownMenuItem onClick={() => handleRunNow(automation.id)} disabled={isTriggering}>
                        <Play className="mr-2 h-4 w-4" />
                        {isTriggering ? "Executando..." : "Executar Agora"}
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(automation.id)} disabled={isDeleting} className="bg-destructive">
                        Continuar
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