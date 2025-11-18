"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SocialAutomationLog } from "@/app/actions/social";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface SocialLogsTableProps {
  logs: SocialAutomationLog[];
}

export function SocialLogsTable({ logs }: SocialLogsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Automação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.social_media_automations?.name || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={log.status === 'error' ? 'destructive' : 'default'}>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}