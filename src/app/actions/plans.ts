"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { getBibleMetadata } from "@/app/actions/ai"; // Reutilizando a função existente
import { Locale } from "@/lib/i18n/config";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

// Schema de validação para o formulário
export const createPlanSchema = z.object({
  name: z.string().min(3, "O nome do plano deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  books: z.array(z.string()).min(1, "Você deve selecionar pelo menos um livro."),
  duration: z.coerce.number().min(1, "A duração deve ser de pelo menos 1 dia."),
  lang: z.custom<Locale>(),
});

export type CreatePlanData = z.infer<typeof createPlanSchema>;

interface ChapterReference {
  book: string;
  chapter: number;
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
    const { name, description, books, duration, lang } = data;

    // 1. Buscar metadados da Bíblia para saber quantos capítulos cada livro tem
    const bibleMetadata = await getBibleMetadata(lang);
    if (!bibleMetadata || bibleMetadata.length === 0) {
      return { success: false, message: "Não foi possível carregar os dados da Bíblia para criar o plano." };
    }

    // 2. Criar uma lista plana de todos os capítulos na ordem selecionada
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

    // 3. Calcular a distribuição de capítulos por dia
    const totalChapters = allChapters.length;
    const dailyReadingSchedule: Record<string, ChapterReference[]> = {};
    let chapterIndex = 0;

    for (let day = 1; day <= duration; day++) {
      const chaptersForThisDay: ChapterReference[] = [];
      // Calcula quantos capítulos alocar para o dia atual para uma distribuição uniforme
      const chaptersToReadCount = Math.ceil((totalChapters - chapterIndex) / (duration - day + 1));
      
      for (let i = 0; i < chaptersToReadCount && chapterIndex < totalChapters; i++) {
        chaptersForThisDay.push(allChapters[chapterIndex]);
        chapterIndex++;
      }
      
      if (chaptersForThisDay.length > 0) {
        dailyReadingSchedule[`day_${day}`] = chaptersForThisDay;
      }
    }

    // 4. Salvar o plano do usuário no banco de dados
    const startDate = new Date();
    const endDate = addDays(startDate, duration - 1);

    const { error } = await supabase.from("user_reading_plans").insert({
      user_id: user.id,
      custom_plan_name: name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      daily_reading_schedule: dailyReadingSchedule,
      // plan_id é nulo porque é um plano customizado
    });

    if (error) {
      throw new Error(error.message);
    }

    // 5. Revalidar o path para que a lista de planos seja atualizada
    revalidatePath(`/${lang}/plans/dashboard`);

    return { success: true, message: "Plano de leitura criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar plano de leitura:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return { success: false, message: `Falha ao criar o plano: ${errorMessage}` };
  }
}