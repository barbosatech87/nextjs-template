"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { Verse } from "@/types/supabase";
import { revalidatePath } from "next/cache";

export type HydratedNote = {
  id: string; // note id
  verse_id: string;
  note: string;
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
  language_code: string;
  created_at: string | null;
  updated_at: string | null;
  verse: Verse;
};

export async function getHydratedNotes(): Promise<HydratedNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_verse_notes')
    .select(`
      id,
      verse_id,
      note,
      created_at,
      updated_at,
      verses ( * )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error("Error fetching hydrated notes:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(n => {
    const verseData = Array.isArray(n.verses) ? n.verses[0] : n.verses;
    return {
      id: n.id,
      verse_id: n.verse_id,
      note: n.note,
      created_at: n.created_at,
      updated_at: n.updated_at,
      book: verseData?.book || 'N/A',
      chapter: verseData?.chapter || 0,
      verse_number: verseData?.verse_number || 0,
      text: verseData?.text || 'Texto do versículo não encontrado.',
      language_code: verseData?.language_code || 'pt',
      verse: verseData as Verse,
    };
  }).filter(n => n.verse);
}

export async function upsertVerseNote(
  verseId: string,
  note: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  if (!note || note.trim() === "") {
    // Se a anotação estiver vazia, remove a existente
    const { error: deleteError } = await supabase
      .from('user_verse_notes')
      .delete()
      .match({ user_id: user.id, verse_id: verseId });

    if (deleteError) {
      console.error("Error deleting note:", deleteError);
      return { success: false, message: deleteError.message };
    }
    revalidatePath('/[lang]/profile', 'page');
    revalidatePath('/[lang]/plans/[planId]', 'page');
    return { success: true, message: "Anotação removida." };
  }

  const { data, error } = await supabase
    .from('user_verse_notes')
    .upsert(
      { user_id: user.id, verse_id: verseId, note: note },
      { onConflict: 'user_id,verse_id' }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting note:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/[lang]/profile', 'page');
  revalidatePath('/[lang]/plans/[planId]', 'page');
  return { success: true, message: "Anotação salva com sucesso!", data };
}

export async function getNotesForVerses(verseIds: string[]): Promise<Record<string, string>> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || verseIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from('user_verse_notes')
        .select('verse_id, note')
        .eq('user_id', user.id)
        .in('verse_id', verseIds);

    if (error) {
        console.error('Error fetching notes:', error);
        return {};
    }

    const notesMap: Record<string, string> = {};
    for (const note of data) {
        notesMap[note.verse_id] = note.note;
    }

    return notesMap;
}