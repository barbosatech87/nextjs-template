"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { Verse } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export async function getFavoriteVerseIds(userId: string): Promise<Set<string>> {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
        .from("user_favorites")
        .select("verse_id")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching favorite verses:", error);
        return new Set();
    }

    return new Set(data.map(fav => fav.verse_id));
}

export async function toggleFavoriteVerse(verse: Verse, isFavorited: boolean): Promise<{ success: boolean; message: string }> {
    const supabase = createSupabaseServerClient();
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