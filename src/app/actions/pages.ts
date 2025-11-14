"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { Page } from "@/types/supabase";
import { marked } from 'marked';

export type PageData = Omit<Page, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'language_code'>;

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
    throw new Error("Acesso negado. Apenas administradores podem gerenciar páginas.");
  }
  return user.id;
}

export async function createPage(pageData: PageData, lang: string) {
  try {
    const author_id = await checkAdmin();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("pages").insert({ ...pageData, author_id, language_code: lang });

    if (error) throw new Error(error.message);

    revalidatePath(`/${lang}/admin/pages`);
    if (pageData.status === 'published') {
      revalidatePath(`/${lang}/p/${pageData.slug}`);
    }

    return { success: true, message: "Página criada com sucesso." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function updatePage(pageId: string, pageData: PageData, lang: string) {
  try {
    await checkAdmin();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("pages")
      .update({ ...pageData, updated_at: new Date().toISOString() })
      .eq('id', pageId);

    if (error) throw new Error(error.message);

    revalidatePath(`/${lang}/admin/pages`);
    revalidatePath(`/${lang}/p/${pageData.slug}`);

    return { success: true, message: "Página atualizada com sucesso." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function deletePage(pageId: string, lang: string) {
  try {
    await checkAdmin();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase.from("pages").delete().eq("id", pageId);

    if (error) throw new Error(error.message);

    revalidatePath(`/${lang}/admin/pages`);
    return { success: true, message: "Página deletada com sucesso." };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ocorreu um erro inesperado.";
    return { success: false, message };
  }
}

export async function getAdminPages(): Promise<Page[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching admin pages:", error);
    return [];
  }
  return data as Page[];
}

export async function getPageById(pageId: string): Promise<Page | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).single();
  if (error) {
    console.error("Error fetching page by ID:", error);
    return null;
  }
  return data as Page;
}

export async function getPageBySlug(slug: string, lang: string): Promise<(Page & { content: string }) | null> {
  const supabase = createSupabaseServerClient();
  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    console.error("Error fetching page by slug:", error);
    return null;
  }

  let finalTitle = page.title;
  let finalSummary = page.summary;
  let contentToParse = page.content || '';
  let finalLanguageCode = page.language_code;

  // Se o idioma solicitado for diferente do original, busca a tradução
  if (lang !== page.language_code) {
    const { data: translation } = await supabase
      .from('page_translations')
      .select('translated_title, translated_summary, translated_content')
      .eq('page_id', page.id)
      .eq('language_code', lang)
      .single();

    if (translation) {
      finalTitle = translation.translated_title;
      finalSummary = translation.translated_summary;
      contentToParse = translation.translated_content || '';
      finalLanguageCode = lang;
    }
  }

  const parsedContent = await marked.parse(contentToParse);
  
  const finalPage: Page & { content: string } = {
    ...page,
    title: finalTitle,
    summary: finalSummary,
    content: parsedContent,
    language_code: finalLanguageCode,
  };

  return finalPage;
}