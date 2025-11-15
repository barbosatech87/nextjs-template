"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";

const getTranslations = (lang: Locale) => {
  if (lang === "en") {
    return {
      title: "Create your account",
      fullName: "Full name",
      email: "Your email",
      password: "Create a password",
      submit: "Sign Up",
      success: "Check your email to confirm your registration.",
      errorGeneral: "We couldn't complete your sign up. Please try again.",
      nameMin: "Enter your full name",
      emailInvalid: "Invalid email",
      passwordMin: "Password must be at least 6 characters",
      haveAccount: "Already have an account? Sign in",
    };
  }
  if (lang === "es") {
    return {
      title: "Crea tu cuenta",
      fullName: "Nombre completo",
      email: "Tu correo",
      password: "Crea una contraseña",
      submit: "Registrarse",
      success: "Revisa tu correo para confirmar tu registro.",
      errorGeneral: "No pudimos completar tu registro. Inténtalo nuevamente.",
      nameMin: "Ingresa tu nombre completo",
      emailInvalid: "Correo inválido",
      passwordMin: "La contraseña debe tener al menos 6 caracteres",
      haveAccount: "¿Ya tienes una cuenta? Inicia sesión",
    };
  }
  return {
    title: "Crie sua conta",
    fullName: "Nome completo",
    email: "Seu email",
    password: "Crie uma senha",
    submit: "Cadastrar",
    success: "Verifique seu email para confirmar o cadastro.",
    errorGeneral: "Não foi possível concluir seu cadastro. Tente novamente.",
    nameMin: "Digite seu nome completo",
    emailInvalid: "Email inválido",
    passwordMin: "A senha deve ter pelo menos 6 caracteres",
    haveAccount: "Já tem uma conta? Entre",
  };
};

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: "Digite seu nome completo" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  lang: Locale;
  onSwitchToSignIn?: () => void;
}

export default function SignUpForm({ lang, onSwitchToSignIn }: SignUpFormProps) {
  const t = getTranslations(lang);

  // Ajusta mensagens do schema conforme idioma
  const localizedSchema = z.object({
    fullName: z.string().min(2, { message: t.nameMin }),
    email: z.string().email({ message: t.emailInvalid }),
    password: z.string().min(6, { message: t.passwordMin }),
  });

  const form = useForm<SignUpValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName, // usado pelo gatilho handle_new_user para popular profiles
        },
      },
    });

    if (error) {
      toast.error(t.errorGeneral);
      return;
    }

    // Em muitos projetos, o Supabase exige verificação de email.
    // Mostramos um aviso amigável e voltamos para a tela de login.
    toast.success(t.success);
    onSwitchToSignIn?.();
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.fullName}</FormLabel>
                <FormControl>
                  <Input placeholder={t.fullName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.email}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.password}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">{t.submit}</Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-muted-foreground hover:text-foreground underline"
        >
          {t.haveAccount}
        </button>
      </div>
    </div>
  );
}