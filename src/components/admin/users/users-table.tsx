"use client";

import React, { useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { AdminUser, updateUserRole } from '@/app/actions/users';
import { Locale } from '@/lib/i18n/config';
import { toast } from 'sonner';

interface UsersTableProps {
  users: AdminUser[];
  lang: Locale;
}

export function UsersTable({ users, lang }: UsersTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, role: 'user' | 'writer' | 'admin') => {
    startTransition(async () => {
      const result = await updateUserRole(userId, role, lang);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'writer': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Data de Cadastro</TableHead>
            <TableHead><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role !== 'writer' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'writer')} disabled={isPending || user.role === 'admin'}>
                        Tornar Escritor
                      </DropdownMenuItem>
                    )}
                    {user.role === 'writer' && (
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')} disabled={isPending}>
                        Tornar Usuário
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}