"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { StoryAutomationLog } from "@/app/actions/stories";

interface StoryLogsTableProps {
  logs: StoryAutomationLog[];
}

export function StoryLogsTable({ logs }: StoryLogsTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'error': return 'destructive';
      case 'success': return 'default';
      case 'processing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Automação / Story</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhum log de automação encontrado.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{log.story_automations?.name || 'Automação Desconhecida'}</span>
                    {log.web_stories?.title && (
                      <span className="text-xs text-muted-foreground">Story: {log.web_stories.title}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(log.status)}>
                    {log.status === 'processing' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {log.details && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Log</DialogTitle>
                        </DialogHeader>
                        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                          <code className="text-white">{JSON.stringify(log.details, null, 2)}</code>
                        </pre>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}