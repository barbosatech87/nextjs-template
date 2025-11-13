"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordChangeFormProps {
  lang: Locale;
}

const passwordSchema = z.object({
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const texts = {
  pt: {
    title: "Alterar Senha",
    password: "Nova Senha",
    save: "Alterar Senha",
    saving: "Alterando...",
    success: "Senha alterada com sucesso! Você precisará fazer login novamente.",
    error: "Erro ao alterar a senha. Tente novamente.",
  },
  en: {
    title: "Change Password",
    password: "New Password",
    save: "Change Password",
    saving: "Changing...",
    success: "Password changed successfully! You will need to log in again.",
    error: "Error changing password. Please try again.",
  },
  es: {
    title: "Cambiar Contraseña",
    password: "Nueva Contraseña",
    save: "Cambiar Contraseña",
    saving: "Cambiando...",
    success: "¡Contraseña cambiada con éxito! Deberá iniciar sesión de nuevo.",
    error: "Error al cambiar la contraseña. Inténtalo de nuevo.",
  },
};

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ lang }) => {
  const t = texts[lang] || texts.pt;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit(values: PasswordFormValues) {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error(t.error);
      console.error(error);
    } else {
      toast.success(t.success);
      form.reset();
      // O Supabase geralmente invalida a sessão após a mudança de senha, forçando o re-login.
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t.title}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.password}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              t.save
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PasswordChangeForm;