"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { Locale } from "@/lib/i18n/config";
import { predefinedPlanSchema, PredefinedPlanFormData } from "@/lib/schemas/reading-plans";

export type PredefinedPlan = {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  books: string[]; // Array of book names in English
  is_public: boolean;
  created_at: string;
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

export async function getPredefinedPlans(): Promise<PredefinedPlan[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reading_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching predefined plans:", error);
    return [];
  }
  return data as PredefinedPlan[];
}

export async function savePredefinedPlan(formData: PredefinedPlanFormData, lang: Locale) {
  try {
    await checkAdmin();
    const validation = predefinedPlanSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, message: validation.error.errors[0]?.message || "Dados inválidos." };
    }

    const supabase = await createSupabaseServerClient();
    const { id, ...planData } = validation.data;

    const dbData = {
      name: planData.name,
      description: planData.description,
      duration_days: planData.duration,
      books: planData.books,
      is_public: planData.is_public,
    };

    if (id) {
      // Update
      const { error } = await supabase
        .from('reading_plans')
        .update(dbData)
        .eq('id', id);
      if (error) throw error;
    } else {
      // Create
      const { error } = await supabase
        .from('reading_plans')
        .insert(dbData);
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin/reading-plans`);
    revalidatePath(`/${lang}/plans`); // Revalidate public page too
    return { success: true, message: `Plano ${id ? 'atualizado' : 'criado'} com sucesso.` };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function deletePredefinedPlan(id: string, lang: Locale) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('reading_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin/reading-plans`);
    revalidatePath(`/${lang}/plans`);
    return { success: true, message: "Plano deletado com sucesso." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}