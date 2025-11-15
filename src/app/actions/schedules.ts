"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Locale } from "@/lib/i18n/config";

export type Schedule = {
  id: string;
  name: string;
  post_type: 'devotional' | 'thematic' | 'summary';
  frequency_cron_expression: string;
  is_active: boolean;
  author_id: string;
  default_image_prompt: string;
  theme?: string | null;
  category_ids?: string[] | null;
};

// Schema de validação para o formulário
export const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome é obrigatório."),
  post_type: z.enum(['devotional', 'thematic', 'summary']),
  theme: z.string().nullable().optional(),
  is_active: z.boolean(),
  author_id: z.string().uuid("Selecione um autor."),
  category_ids: z.array(z.string().uuid()).nullable().optional(),
  default_image_prompt: z.string().min(10, "O prompt da imagem é obrigatório."),
  
  // Novos campos para a UI amigável
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm).").optional(),
  dayOfWeek: z.string().optional(), // 0-6 (Sun-Sat)
  dayOfMonth: z.string().optional(), // 1-31
  frequency_cron_expression: z.string().optional(), // Mantido para o modo 'custom'
}).refine(data => {
    if (data.post_type === 'thematic') return !!data.theme && data.theme.length > 3;
    return true;
}, { message: "O tema é obrigatório para o tipo 'Estudo Temático'.", path: ['theme'] })
.refine(data => {
    if (data.frequencyType !== 'custom') return !!data.time;
    return true;
}, { message: "A hora é obrigatória.", path: ['time'] })
.refine(data => {
    if (data.frequencyType === 'weekly') return !!data.dayOfWeek;
    return true;
}, { message: "O dia da semana é obrigatório.", path: ['dayOfWeek'] })
.refine(data => {
    if (data.frequencyType === 'monthly') return !!data.dayOfMonth;
    return true;
}, { message: "O dia do mês é obrigatório.", path: ['dayOfMonth'] })
.refine(data => {
    if (data.frequencyType === 'custom') return !!data.frequency_cron_expression && data.frequency_cron_expression.length > 0;
    return true;
}, { message: "A expressão Cron é obrigatória no modo personalizado.", path: ['frequency_cron_expression'] });

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

function constructCronExpression(data: ScheduleFormData): string {
  if (data.frequencyType === 'custom') {
    return data.frequency_cron_expression!;
  }

  const [hour, minute] = data.time!.split(':');
  
  switch (data.frequencyType) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${data.dayOfWeek}`;
    case 'monthly':
      return `${minute} ${hour} ${data.dayOfMonth} * *`;
    default:
      throw new Error('Tipo de frequência inválido');
  }
}

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
      const firstError = validation.error.errors[0]?.message || "Dados inválidos.";
      return { success: false, message: firstError };
    }

    const supabase = createSupabaseServerClient();
    const { id, frequencyType, time, dayOfWeek, dayOfMonth, ...scheduleData } = validation.data;

    const cronExpression = constructCronExpression(validation.data);

    const dbData = {
      ...scheduleData,
      frequency_cron_expression: cronExpression,
    };

    if (id) {
      // Atualizar
      const { error } = await supabase
        .from('automatic_post_schedules')
        .update({ ...dbData, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      // Criar
      const { error } = await supabase
        .from('automatic_post_schedules')
        .insert(dbData);
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