"use client";

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getAdminUsers } from '@/app/actions/users';
import { toast } from 'sonner';

export function ExportUsersButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const users = await getAdminUsers();
        if (users.length === 0) {
          toast.info("Nenhum usuário para exportar.");
          return;
        }

        const csvHeader = "first_name,last_name,email\n";
        const csvRows = users.map(user => {
          const firstName = user.first_name || '';
          const lastName = user.last_name || '';
          const email = user.email || '';
          return `"${firstName}","${lastName}","${email}"`;
        }).join("\n");

        const csvContent = csvHeader + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "paxword_users.csv");
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        toast.success("Exportação iniciada.");
      } catch (error) {
        toast.error("Falha ao exportar usuários.");
        console.error(error);
      }
    });
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      <Download className="mr-2 h-4 w-4" />
      {isPending ? "Exportando..." : "Exportar Usuários"}
    </Button>
  );
}