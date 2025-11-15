"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Locale } from "@/lib/i18n/config";

// Schema de validação para o formulário
const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome é obrigatório."),
  post_type: z.string().default('devotional'),
  frequency_cron_expression: z.string().min(1, "A frequência é obrigatória."),
  default_image_prompt: z.string().min(10, "O prompt da imagem é obrigatório."),
  is_active: z.boolean().default(true),
  author_id: z.string().uuid("Selecione um autor."),
});

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

async function checkAdmin() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error("Acesso negado.");
  }
}

export async function getSchedules() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('automatic_post_schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }
  return data;
}

export async function saveSchedule(formData: ScheduleFormData, lang: Locale) {
  try {
    await checkAdmin();
    const validation = scheduleSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, message: "Dados inválidos." };
    }

    const supabase = createSupabaseServerClient();
    const { id, ...scheduleData } = validation.data;

    if (id) {
      // Atualizar
      const { error } = await supabase
        .from('automatic_post_schedules')
        .update({ ...scheduleData, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      // Criar
      const { error } = await supabase
        .from('automatic_post_schedules')
        .insert(scheduleData);
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin/schedules`);
    return { success: true, message: `Agendamento ${id ? 'atualizado' : 'criado'} com sucesso.` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function deleteSchedule(id: string, lang: Locale) {
  try {
    await checkAdmin();
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('automatic_post_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin/schedules`);
    return { success: true, message: "Agendamento deletado com sucesso." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}