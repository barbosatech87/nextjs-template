"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { WebStory } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";
import { storyAutomationSchema, StoryAutomationFormData } from "@/lib/schemas/stories";

// Cliente público para cache/ISR se necessário
const getPublicClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export type CreateStoryData = {
  title: string;
  slug: string;
  story_data: any;
  poster_image_src: string;
  status: 'draft' | 'published' | 'archived';
};

export type StoryAutomation = {
  id: string;
  name: string;
  is_active: boolean;
  frequency_cron_expression: string;
  source_category_id?: string | null;
  number_of_pages?: number;
  add_post_link_on_last_page?: boolean;
  publish_automatically?: boolean;
};

export type StoryAutomationLog = {
  id: string;
  story_id: string;
  automation_id: string | null;
  status: 'success' | 'error' | 'processing';
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  web_stories: {
    title: string;
  } | null;
  story_automations: {
    name: string;
  } | null;
};


// --- Funções de Leitura (Públicas) ---

export async function getStoryBySlug(slug: string, lang: string): Promise<WebStory | null> {
  const supabase = getPublicClient();

  const { data: story, error } = await supabase
    .from('web_stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !story) {
    console.error(`Error fetching story ${slug}:`, error);
    return null;
  }

  if (lang !== story.language_code) {
    const { data: translation } = await supabase
      .from('web_story_translations')
      .select('title, story_data')
      .eq('story_id', story.id)
      .eq('language_code', lang)
      .single();

    if (translation) {
      return {
        ...story,
        title: translation.title,
        story_data: translation.story_data,
        language_code: lang,
      };
    }
  }

  return story as WebStory;
}

export async function getPublishedStories(lang: string, limit = 10) {
  const supabase = getPublicClient();

  const { data: stories, error } = await supabase
    .from('web_stories')
    .select('id, title, slug, poster_image_src, published_at, language_code')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  if (lang !== 'pt') {
    const storyIds = stories.map(s => s.id);
    const { data: translations } = await supabase
      .from('web_story_translations')
      .select('story_id, title')
      .in('story_id', storyIds)
      .eq('language_code', lang);

    if (translations) {
      const translationMap = new Map(translations.map(t => [t.story_id, t]));
      return stories.map(s => {
        const t = translationMap.get(s.id);
        return t ? { ...s, title: t.title } : s;
      });
    }
  }

  return stories;
}

export async function getPaginatedPublishedStories(lang: string, page: number, limit: number = 9) {
  const supabase = getPublicClient();
  const offset = (page - 1) * limit;

  const { data: stories, count, error } = await supabase
    .from('web_stories')
    .select('id, title, slug, poster_image_src, published_at, language_code', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching paginated stories:", error);
    return { stories: [], totalPages: 0 };
  }

  let finalStories = stories || [];

  if (lang !== 'pt' && finalStories.length > 0) {
    const storyIds = finalStories.map(s => s.id);
    const { data: translations } = await supabase
      .from('web_story_translations')
      .select('story_id, title')
      .in('story_id', storyIds)
      .eq('language_code', lang);

    if (translations) {
      const translationMap = new Map(translations.map(t => [t.story_id, t]));
      finalStories = finalStories.map(s => {
        const t = translationMap.get(s.id);
        return t ? { ...s, title: t.title } : s;
      });
    }
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;
  return { stories: finalStories, totalPages };
}


// --- Funções Administrativas ---

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    throw new Error("Acesso negado.");
  }
  return user.id;
}

export async function createStory(data: CreateStoryData) {
  try {
    const userId = await checkAdmin();
    const supabase = await createSupabaseServerClient();

    const { data: newStory, error } = await supabase
      .from('web_stories')
      .insert({
        ...data,
        author_id: userId,
        published_at: data.status === 'published' ? new Date().toISOString() : null,
      })
      .select('id, title, story_data')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/admin/stories');
    return { success: true, message: "Story criada com sucesso.", storyId: newStory.id, title: newStory.title, storyData: newStory.story_data };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

export async function updateStory(id: string, data: Partial<CreateStoryData>, lang: string) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    } as any;

    if (data.status === 'published') {
      const { data: current } = await supabase.from('web_stories').select('published_at').eq('id', id).single();
      if (!current?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('web_stories')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/stories');
    if (data.slug) revalidatePath(`/${lang}/web-stories/${data.slug}`);
    
    return { success: true, message: "Story atualizada com sucesso.", storyId: id, title: data.title, storyData: data.story_data };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

export async function deleteStory(id: string) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from('web_stories').delete().eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/stories');
    return { success: true, message: "Story removida." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}

export async function getAdminStories() {
  const supabase = await createSupabaseServerClient();
  
  const { data: stories, error: storiesError } = await supabase
    .from('web_stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (storiesError) {
    console.error("Error fetching admin stories:", storiesError);
    return [];
  }

  const authorIds = [...new Set(stories.map(s => s.author_id).filter(Boolean))];

  if (authorIds.length === 0) {
    return stories.map(story => ({ ...story, profiles: null }));
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', authorIds as string[]);

  if (profilesError) {
    console.error("Error fetching profiles for stories:", profilesError);
    return stories.map(story => ({ ...story, profiles: null }));
  }

  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  const combinedStories = stories.map(story => ({
    ...story,
    profiles: story.author_id ? profilesMap.get(story.author_id) || null : null,
  }));

  return combinedStories;
}

export async function getStoryById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('web_stories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as WebStory;
}

export async function getStoryAutomationLogs(): Promise<StoryAutomationLog[]> {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('story_automation_logs')
      .select('*, web_stories(title), story_automations(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching story automation logs:", error);
      return [];
    }
    return data as StoryAutomationLog[];
  } catch (e) {
    console.error("Unexpected error in getStoryAutomationLogs:", e);
    return [];
  }
}

// --- Funções de Automação de Story ---

function constructCronExpression(data: StoryAutomationFormData): string {
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

export async function getStoryAutomations(): Promise<StoryAutomation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('story_automations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching story automations:", error);
    return [];
  }
  return data;
}

export async function saveStoryAutomation(formData: StoryAutomationFormData, lang: string) {
  try {
    await checkAdmin();
    const validation = storyAutomationSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, message: validation.error.errors[0]?.message || "Dados inválidos." };
    }

    const supabase = await createSupabaseServerClient();
    const { id, frequencyType, time, dayOfWeek, dayOfMonth, ...automationData } = validation.data;
    const cronExpression = constructCronExpression(validation.data);

    const dbData = { ...automationData, frequency_cron_expression: cronExpression };

    if (id) {
      const { error } = await supabase.from('story_automations').update(dbData).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('story_automations').insert(dbData);
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin/stories`);
    return { success: true, message: `Automação ${id ? 'atualizada' : 'criada'} com sucesso.` };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Ocorreu um erro." };
  }
}

export async function deleteStoryAutomation(id: string, lang: string) {
  try {
    await checkAdmin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('story_automations').delete().eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath(`/${lang}/admin/stories`);
    return { success: true, message: "Automação deletada com sucesso." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Ocorreu um erro." };
  }
}

export async function triggerStoryAutomationManually(automationId: string, lang: string) {
  try {
    await checkAdmin();

    const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/generate-automatic-story`;
    const internalSecret = process.env.INTERNAL_SECRET_KEY;

    if (!internalSecret) {
      throw new Error("Chave secreta interna não configurada no servidor.");
    }

    // Aciona a Edge Function (sem await para não travar a UI, ou com await se quisermos feedback imediato)
    // Aqui usamos await para retornar erro caso a função falhe imediatamente
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

    revalidatePath(`/${lang}/admin/stories`);
    
    return { success: true, message: "Execução manual iniciada. Verifique o histórico em instantes." };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Ocorreu um erro inesperado." };
  }
}