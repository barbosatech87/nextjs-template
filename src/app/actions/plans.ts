"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { getBibleMetadata } from "@/app/actions/ai";
import { Locale } from "@/lib/i18n/config";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { createPlanSchema, CreatePlanData } from "@/lib/schemas/plans";
import { UserReadingPlan, Verse } from "@/types/supabase";
import { notFound } from "next/navigation";

interface ChapterReference {
  book: string;
  chapter: number;
}

export async function getUserActiveReadingPlans(): Promise<UserReadingPlan[]> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_reading_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar planos de leitura:", error);
    return [];
  }

  return data as UserReadingPlan[];
}

export async function getPlanAndProgress(planId: string): Promise<{ plan: UserReadingPlan; completedDays: Set<number> }> {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) notFound();

    const { data: plan, error: planError } = await supabase
        .from("user_reading_plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", user.id)
        .single();

    if (planError || !plan) {
        console.error("Plano não encontrado ou erro:", planError);
        notFound();
    }

    const { data: progress, error: progressError } = await supabase
        .from("user_reading_progress")
        .select("day_number")
        .eq("user_plan_id", planId);

    if (progressError) {
        console.error("Erro ao buscar progresso:", progressError);
        // Continua mesmo com erro, o progresso será 0
    }

    const completedDays = new Set(progress?.map(p => p.day_number) || []);

    return { plan, completedDays };
}

export async function getChaptersText(chapters: ChapterReference[], lang: Locale): Promise<Verse[]> {
    const supabase = createSupabaseServerClient();
    const queries = chapters.map(c => 
        supabase.from("verses")
            .select("id, book, chapter, verse_number, text")
            .eq("language_code", lang)
            .eq("book", c.book)
            .eq("chapter", c.chapter)
            .order("verse_number", { ascending: true })
    );

    const results = await Promise.all(queries);
    const verses: Verse[] = [];

    results.forEach(res => {
        if (res.data) {
            verses.push(...res.data as Verse[]);
        }
    });

    return verses;
}

export async function updateReadingProgress(planId: string, dayNumber: number, isCompleted: boolean, lang: Locale) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Usuário não autenticado." };
    }

    if (isCompleted) {
        const { error } = await supabase.from("user_reading_progress").insert({
            user_plan_id: planId,
            user_id: user.id,
            day_number: dayNumber,
        });
        if (error && error.code !== '23505') { // Ignora erro de duplicata
             console.error("Erro ao marcar como lido:", error);
             return { success: false, message: error.message };
        }
    } else {
        const { error } = await supabase.from("user_reading_progress")
            .delete()
            .eq("user_plan_id", planId)
            .eq("day_number", dayNumber);
        if (error) {
            console.error("Erro ao desmarcar como lido:", error);
            return { success: false, message: error.message };
        }
    }

    revalidatePath(`/${lang}/plans/${planId}`);
    revalidatePath(`/${lang}/plans`); // Revalida a página principal para atualizar a barra de progresso
    return { success: true };
}


export async function createUserReadingPlan(
  data: CreatePlanData
): Promise<{ success: boolean; message: string }> {
  const validation = createPlanSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "Dados inválidos." };
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  try {
    const { name, books, duration, lang } = data;

    const bibleMetadata = await getBibleMetadata(lang);
    if (!bibleMetadata || bibleMetadata.length === 0) {
      return { success: false, message: "Não foi possível carregar os dados da Bíblia para criar o plano." };
    }

    const allChapters: ChapterReference[] = [];
    for (const bookName of books) {
      const bookMeta = bibleMetadata.find(b => b.book === bookName);
      if (bookMeta) {
        for (let i = 1; i <= bookMeta.total_chapters; i++) {
          allChapters.push({ book: bookName, chapter: i });
        }
      }
    }

    if (allChapters.length === 0) {
        return { success: false, message: "Nenhum capítulo encontrado para os livros selecionados." };
    }

    const totalChapters = allChapters.length;
    const dailyReadingSchedule: Record<string, ChapterReference[]> = {};
    let chapterIndex = 0;

    for (let day = 1; day <= duration; day++) {
      const chaptersForThisDay: ChapterReference[] = [];
      const chaptersToReadCount = Math.ceil((totalChapters - chapterIndex) / (duration - day + 1));
      
      for (let i = 0; i < chaptersToReadCount && chapterIndex < totalChapters; i++) {
        chaptersForThisDay.push(allChapters[chapterIndex]);
        chapterIndex++;
      }
      
      if (chaptersForThisDay.length > 0) {
        dailyReadingSchedule[`day_${day}`] = chaptersForThisDay;
      }
    }

    const startDate = new Date();
    const endDate = addDays(startDate, duration - 1);

    const { error } = await supabase.from("user_reading_plans").insert({
      user_id: user.id,
      custom_plan_name: name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      daily_reading_schedule: dailyReadingSchedule,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/${lang}/plans`);

    return { success: true, message: "Plano de leitura criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar plano de leitura:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return { success: false, message: `Falha ao criar o plano: ${errorMessage}` };
  }
}