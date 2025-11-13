"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProfile } from '@/hooks/use-profile';
import { Profile } from '@/types/supabase';
import { Loader2 } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface ProfileFormProps {
  lang: Locale;
  initialProfile: Profile | null;
}

const profileSchema = z.object({
  first_name: z.string().min(1, { message: "O primeiro nome é obrigatório." }).max(50, { message: "Máximo de 50 caracteres." }).optional().or(z.literal('')),
  last_name: z.string().max(50, { message: "Máximo de 50 caracteres." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const texts = {
  pt: {
    title: "Informações do Perfil",
    firstName: "Primeiro Nome",
    lastName: "Sobrenome",
    save: "Salvar Alterações",
    saving: "Salvando...",
  },
  en: {
    title: "Profile Information",
    firstName: "First Name",
    lastName: "Last Name",
    save: "Save Changes",
    saving: "Saving...",
  },
  es: {
    title: "Información del Perfil",
    firstName: "Nombre",
    lastName: "Apellido",
    save: "Guardar Cambios",
    saving: "Guardando...",
  },
};

const ProfileForm: React.FC<ProfileFormProps> = ({ lang, initialProfile }) => {
  const { updateProfile } = useProfile();
  const t = texts[lang] || texts.pt;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: initialProfile?.first_name || '',
      last_name: initialProfile?.last_name || '',
    },
    values: {
      first_name: initialProfile?.first_name || '',
      last_name: initialProfile?.last_name || '',
    }
  });

  async function onSubmit(values: ProfileFormValues) {
    const success = await updateProfile(values);
    if (success) {
      form.reset(values); // Resetar o formulário para refletir o novo estado
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t.title}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.firstName}</FormLabel>
                <FormControl>
                  <Input placeholder={t.firstName} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.lastName}</FormLabel>
                <FormControl>
                  <Input placeholder={t.lastName} {...field} />
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

export default ProfileForm;