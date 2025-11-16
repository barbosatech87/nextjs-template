"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { Verse } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export async function getFavoriteVerseIds(userId: string): Promise<Set<string>> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("user_favorites")
        .select("verse_id")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching favorite verses:", error);
        return new Set();
    }

    return new Set(data.map(fav => fav.verse_id).filter(Boolean) as string[]);
}

export async function toggleFavoriteVerse(verse: Verse, isFavorited: boolean): Promise<{ success: boolean; message: string }> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Usuário não autenticado." };
    }

    if (isFavorited) {
        // Remover dos favoritos
        const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("verse_id", verse.id);

        if (error) {
            console.error("Erro ao remover favorito:", error);
            return { success: false, message: error.message };
        }
        revalidatePath('/profile'); // Revalida a página de perfil onde os favoritos são listados
        return { success: true, message: "Versículo removido dos favoritos." };

    } else {
        // Adicionar aos favoritos
        const { error } = await supabase.from("user_favorites").insert({
            user_id: user.id,
            verse_id: verse.id,
            book: verse.book,
            chapter: verse.chapter,
            verse_number: verse.verse_number,
            language_code: verse.language_code,
        });

        if (error) {
            console.error("Erro ao adicionar favorito:", error);
            return { success: false, message: error.message };
        }
        revalidatePath('/profile');
        return { success: true, message: "Versículo adicionado aos favoritos!" };
    }
}

export type HydratedFavorite = {
  id: string; // favorite id
  verse_id: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  language_code: string;
  created_at: string | null;
  verse: Verse;
};

export async function getHydratedFavorites(): Promise<HydratedFavorite[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      id,
      verse_id,
      book,
      chapter,
      verse_number,
      language_code,
      created_at,
      verses ( * )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching hydrated favorites:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(fav => {
    const verseData = Array.isArray(fav.verses) ? fav.verses[0] : fav.verses;
    return {
      id: fav.id,
      verse_id: fav.verse_id,
      book: fav.book,
      chapter: fav.chapter,
      verse_number: fav.verse_number,
      language_code: fav.language_code,
      created_at: fav.created_at,
      text: verseData?.text || 'Texto do versículo não encontrado.',
      verse: verseData as Verse,
    };
  }).filter(fav => fav.verse);
}