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