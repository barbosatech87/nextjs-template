"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { Locale } from "@/lib/i18n/config";
import { socialAutomationSchema, SocialAutomationFormData } from "@/lib/schemas/social";

export type SocialAutomation = {
  id: string;
  name: string;
  platform: 'pinterest' | 'facebook';
  is_active: boolean;
  source_category_id?: string | null;
  pinterest_board_id?: string | null;
  image_prompt_template: string;
  description_template: string;
  frequency_cron_expression: string;
};

export type SocialAutomationLog = {
  id: string;
  automation_id: string;
  status: 'success' | 'error' | 'processing';
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  social_media_automations: {
    name: string;
  } | null;
};

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

function constructCronExpression(data: SocialAutomationFormData): string {
  if (data.frequencyType === 'custom') {
    return data.frequency_cron_expression!;
  }
  const [hour, minute] = data.time!.split(':');
  switch (data.frequencyType) {
    case 'daily': return `${minute} ${hour} * * *`;
    case 'weekly': return `${minute} ${hour} * * ${data.dayOfWeek}`;
    case 'monthly': return `${minute} ${hour} ${data.dayOfMonth} * *`;
    default: throw new Error('Tipo de frequência inválido');
  }
}

export async function getSocialAutomations(): Promise<SocialAutomation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('social_media_automations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching social automations:", error);
    return [];
  }
  return data;
}

export async function saveSocialAutomation(formData: SocialAutomationFormData, lang: Locale) {
  try {
    await checkAdmin();
    const validation = socialAutomationSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, message: validation.error.errors[0]?.message || "Dados inválidos." };
    }

    const supabase = await createSupabaseServerClient();
    const { id, frequencyType, time, dayOfWeek, dayOfMonth, ...automationData } = validation.data;
    const cronExpression = constructCronExpression(validation.data);

    const dbData = { ...automationData, frequency_cron_expression: cronExpression };

    if (id) {
      const { error } = await supabase.from('social_media_automations').update(dbData).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('social_media_automations').insert(dbData);
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin/social`);
    return { success: true, message: `Automação ${id ? 'atualizada' : 'criada'} com sucesso.` };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Ocorreu um erro." };
  }
}

export async function deleteSocialAutomation(id: string, lang: Locale) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('social_media_automations').delete().eq('id', id);
    if (error) throw error;

    revalidatePath(`/${lang}/admin/social`);
    return { success: true, message: "Automação deletada com sucesso." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Ocorreu um erro." };
  }
}

export async function triggerSocialAutomationManually(automationId: string, lang: Locale) {
  try {
    await checkAdmin();

    const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/post-to-pinterest`;
    const internalSecret = process.env.INTERNAL_SECRET_KEY;

    if (!internalSecret) {
      throw new Error("Chave secreta interna não configurada no servidor.");
    }

    // Aguarda a resposta da Edge Function para capturar erros
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({ automationId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `A função retornou um erro ${response.status}.`);
    }

    revalidatePath(`/${lang}/admin/social/logs`);

    return { success: true, message: "Execução manual iniciada. Verifique o histórico para ver o resultado." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function getSocialAutomationLogs(): Promise<SocialAutomationLog[]> {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('social_media_post_logs')
      .select('*, social_media_automations(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching social automation logs:", error);
      return [];
    }
    return data as SocialAutomationLog[];
  } catch (e) {
    console.error("Unexpected error in getSocialAutomationLogs:", e);
    return [];
  }
}

export async function clearOldProcessingLogs(lang: Locale) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();

    // Define o tempo limite (1 hora atrás)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('social_media_post_logs')
      .delete({ count: 'exact' })
      .eq('status', 'processing')
      .lt('created_at', oneHourAgo);

    if (error) {
      throw error;
    }

    revalidatePath(`/${lang}/admin/social/logs`);
    
    if (count === 0) {
        return { success: true, message: "Nenhum log antigo para limpar." };
    }

    return { success: true, message: `${count} log(s) antigo(s) foram limpos com sucesso.` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}