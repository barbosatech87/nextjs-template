"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { Locale } from "@/lib/i18n/config";
import { scheduleSchema, ScheduleFormData } from "@/lib/schemas/schedules";

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
  publish_automatically: boolean;
};

// Novo tipo para os logs
export type AutomationLog = {
  id: string;
  schedule_id: string;
  status: 'success' | 'error';
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
  automatic_post_schedules: {
    name: string;
  } | null;
};


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
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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

    const supabase = await createSupabaseServerClient();
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
    const supabase = await createSupabaseServerClient();
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

export async function getAutomationLogs(): Promise<AutomationLog[]> {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*, automatic_post_schedules(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching automation logs:", error);
      return [];
    }
    return data as AutomationLog[];
  } catch (e) {
    console.error("Unexpected error in getAutomationLogs:", e);
    return [];
  }
}

export async function triggerScheduleManually(scheduleId: string, lang: Locale) {
  try {
    await checkAdmin();

    const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/generate-automatic-post`;
    const internalSecret = process.env.INTERNAL_SECRET_KEY;

    if (!internalSecret) {
      throw new Error("Chave secreta interna não configurada no servidor.");
    }

    // A chamada não é aguardada (await) de propósito.
    // A Edge Function é acionada e o usuário pode continuar navegando.
    // O resultado será visível na página de logs.
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({ scheduleId }),
    });

    // Revalida o cache da página de logs para que o novo registro apareça.
    revalidatePath(`/${lang}/admin/schedules/logs`);

    return { success: true, message: "Execução manual iniciada. Verifique o histórico para ver o resultado." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado ao acionar o agendamento.";
    return { success: false, message };
  }
}