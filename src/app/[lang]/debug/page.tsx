"use client";

import { useSession } from "@/components/auth/session-context-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function DebugPage() {
  const { user, isLoading } = useSession();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success("ID do usuário copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Página de Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-2">
              <Label htmlFor="userId">Seu ID de Usuário:</Label>
              <div className="flex space-x-2">
                <Input id="userId" type="text" value={user.id} readOnly />
                <Button onClick={handleCopy}>
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use este ID para atualizar sua função no banco de dados.
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhum usuário logado. Faça login para ver seu ID.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}