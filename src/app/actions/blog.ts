"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPost } from "@/types/supabase";
import { marked } from 'marked';

// Helper function to remove the first H1 from markdown content
function removeFirstH1(markdown: string): string {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  // Check if the first non-empty line is an H1
  const firstLineIndex = lines.findIndex(line => line.trim() !== '');
  if (firstLineIndex === -1) return markdown; // All lines are empty

  if (lines[firstLineIndex].trim().startsWith('# ')) {
    lines.splice(firstLineIndex, 1);
    return lines.join('\n');
  }
  return markdown;
}

// Tipos para a função de criação
export type NewPostData = Omit<BlogPost, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'status' | 'language_code'> & {
  category_ids: string[];
  status: 'draft' | 'published' | 'archived';
  // Adicionando campos que foram omitidos, mas são necessários no payload
  published_at: string | null;
  scheduled_for: string | null;
};

// Tipo de retorno para criação bem-sucedida (necessário para o diálogo de tradução)
type CreatePostSuccess = {
  success: true;
  message: string;
  postId: string;
  postContent: { title: string; summary: string | null; content: string };
};

type ActionResponse = CreatePostSuccess | { success: false; message: string; };

export async function createPost(postData: NewPostData, lang: string): Promise<ActionResponse> {
  try {
    const supabase = createSupabaseServerClient();
    
    // 1. Verificar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'writer') {
      return { success: false, message: "Acesso negado." };
    }

    const { category_ids, ...postDetails } = postData;

    // 2. Inserir o post principal
    const { data: newPost, error: postError } = await supabase
      .from("blog_posts")
      .insert({
        ...postDetails,
        author_id: user.id,
        language_code: lang, // Garante que o código do idioma seja salvo
      })
      .select('id, title, summary, content') // Seleciona o conteúdo para a tradução
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      return { success: false, message: `Falha ao criar o post principal: ${postError.message}` };
    }

    // 3. Inserir as categorias
    if (category_ids && category_ids.length > 0) {
      const postCategories = category_ids.map(categoryId => ({
        post_id: newPost.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('blog_post_categories')
        .insert(postCategories);

      if (categoryError) {
        console.error("Error inserting post categories:", categoryError);
        // Nota: Não falhamos a operação inteira, mas logamos o erro.
      }
    }

    revalidatePath(`/${lang}/admin/blog`);
    return { 
      success: true, 
      message: "Post criado com sucesso.", 
      postId: newPost.id,
      postContent: {
        title: newPost.title,
        summary: newPost.summary,
        content: newPost.content,
      }
    };
  } catch (e) {
    console.error("Unexpected error in createPost:", e);
    return { success: false, message: "Ocorreu um erro inesperado ao criar o post." };
  }
}

export async function updatePost(postId: string, postData: NewPostData, lang: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    // 1. Verificar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permite que admins editem qualquer post, e writers editem seus próprios posts.
    if (profile?.role === 'writer') {
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('author_id')
        .eq('id', postId)
        .single();
        
      if (fetchError || post?.author_id !== user.id) {
        return { success: false, message: "Acesso negado ou post não encontrado." };
      }
    } else if (profile?.role !== 'admin') {
      return { success: false, message: "Acesso negado." };
    }

    const { category_ids, ...postDetails } = postData;

    // 2. Atualizar o post principal
    const { error: postError } = await supabase
      .from("blog_posts")
      .update({
        ...postDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (postError) {
      console.error("Error updating post:", postError);
      return { success: false, message: `Falha ao atualizar o post principal: ${postError.message}` };
    }

    // 3. Atualizar as categorias (Deleta todas e insere as novas)
    // Deletar categorias existentes
    const { error: deleteError } = await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    if (deleteError) {
      console.error("Error deleting existing categories:", deleteError);
      // Continua, mas loga o erro
    }

    // Inserir novas categorias
    if (category_ids && category_ids.length > 0) {
      const postCategories = category_ids.map(categoryId => ({
        post_id: postId,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('blog_post_categories')
        .insert(postCategories);

      if (categoryError) {
        console.error("Error inserting new post categories:", categoryError);
      }
    }

    revalidatePath(`/${lang}/admin/blog`);
    revalidatePath(`/${lang}/blog/${postDetails.slug}`);
    return { success: true, message: "Post atualizado com sucesso." };
  } catch (e) {
    console.error("Unexpected error in updatePost:", e);
    return { success: false, message: "Ocorreu um erro inesperado ao atualizar o post." };
  }
}

export async function deletePost(postId: string, lang: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Adicionar verificação de permissão de administrador/writer
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Permite que admins deletem qualquer post, e writers deletem seus próprios posts.
    if (profile?.role === 'writer') {
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('author_id')
        .eq('id', postId)
        .single();
        
      if (fetchError || post?.author_id !== user.id) {
        return { success: false, message: "Acesso negado ou post não encontrado." };
      }
    } else if (profile?.role !== 'admin') {
      return { success: false, message: "Acesso negado." };
    }

    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      return { success: false, message: `Falha ao deletar o post: ${error.message}` };
    }

    revalidatePath(`/${lang}/admin/blog`);
    return { success: true, message: "Post deletado com sucesso." };
  } catch (e) {
    console.error("Unexpected error in deletePost:", e);
    return { success: false, message: "Ocorreu um erro inesperado ao deletar o post." };
  }
}

// --- Funções para o Blog Público ---

const POSTS_PER_PAGE = 9;

export type PostListItem = {
  id: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
  // Campos que podem vir da tradução ou do original
  title: string;
  summary: string | null;
  language_code: string;
};

export type PostDetail = {
  id: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
  author_id: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  // Campos que podem vir da tradução ou do original
  title: string;
  summary: string | null;
  content: string;
  language_code: string;
  category_ids: string[];
};

export type EditablePostData = Omit<BlogPost, 'author_id' | 'created_at' | 'updated_at'> & {
  category_ids: string[];
};

/**
 * Busca um post específico por ID, incluindo categorias, para edição.
 */
export async function getPostById(postId: string): Promise<EditablePostData | null> {
  const supabase = createSupabaseServerClient();

  // 1. Buscar o post principal
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    console.error("Error fetching post by ID:", postError);
    return null;
  }

  // 2. Buscar as categorias associadas
  const { data: postCategories, error: categoryError } = await supabase
    .from('blog_post_categories')
    .select('category_id')
    .eq('post_id', postId);

  if (categoryError) {
    console.error("Error fetching post categories:", categoryError);
    // Continua, mas sem categorias
  }

  const category_ids = postCategories ? postCategories.map(pc => pc.category_id) : [];

  // Remove campos que não são necessários no formulário ou que são gerenciados automaticamente
  const { author_id, created_at, updated_at, ...rest } = post;

  return {
    ...rest,
    category_ids,
  } as EditablePostData;
}


/**
 * Busca posts publicados com paginação, priorizando a tradução para o idioma solicitado.
 */
export async function getPublishedPosts(lang: string, page: number = 1) {
  const supabase = createSupabaseServerClient();
  const offset = (page - 1) * POSTS_PER_PAGE;

  // 1. Buscar posts originais publicados, ordenados por data de publicação
  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, summary, image_url, published_at, language_code', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  const { data: originalPosts, count, error } = await query;

  if (error) {
    console.error("Error fetching published posts:", error);
    return { posts: [], totalPages: 0, currentPage: page };
  }

  if (!originalPosts || originalPosts.length === 0) {
    return { posts: [], totalPages: 0, currentPage: page };
  }

  const postIds = originalPosts.map(p => p.id);
  
  // 2. Se o idioma solicitado não for o idioma original (pt), buscar traduções
  let finalPosts: PostListItem[] = originalPosts.map(p => ({
    id: p.id,
    slug: p.slug,
    image_url: p.image_url,
    published_at: p.published_at,
    title: p.title,
    summary: p.summary,
    language_code: p.language_code,
  }));

  if (lang !== 'pt') {
    const { data: translations, error: transError } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (transError) {
      console.error("Error fetching translations:", transError);
      // Continua com os posts originais se a tradução falhar
    } else if (translations) {
      const translationMap = new Map(translations.map(t => [t.post_id, t]));

      finalPosts = finalPosts.map(post => {
        const translation = translationMap.get(post.id);
        if (translation) {
          return {
            ...post,
            title: translation.translated_title,
            summary: translation.translated_summary,
            language_code: translation.language_code, // Atualiza o código do idioma para o traduzido
          };
        }
        return post;
      });
    }
  }

  const totalPages = count ? Math.ceil(count / POSTS_PER_PAGE) : 0;

  return { 
    posts: finalPosts, 
    totalPages, 
    currentPage: page 
  };
}

/**
 * Busca um post específico por slug, priorizando a tradução para o idioma solicitado.
 */
export async function getPostBySlug(slug: string, lang: string): Promise<PostDetail | null> {
  const supabase = createSupabaseServerClient();

  // 1. Buscar o post original pelo slug
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, summary, content, image_url, published_at, language_code, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (postError || !post) {
    console.error("Error fetching post by slug:", postError);
    return null;
  }

  // 2. Buscar o perfil do autor separadamente para maior robustez
  let authorProfile: { first_name: string | null, last_name: string | null } | null = null;
  if (post.author_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', post.author_id)
      .single();
    authorProfile = profileData;
  }

  // 3. Buscar as categorias do post
  const { data: postCategories, error: categoryError } = await supabase
    .from('blog_post_categories')
    .select('category_id')
    .eq('post_id', post.id);

  if (categoryError) {
    console.error(`Error fetching categories for post ${post.id}:`, categoryError);
  }
  const category_ids = postCategories ? postCategories.map(pc => pc.category_id) : [];

  const contentWithoutTitle = removeFirstH1(post.content || '');
  let contentToParse = contentWithoutTitle;
  let finalLanguageCode = post.language_code;
  let finalTitle = post.title;
  let finalSummary = post.summary;

  // 4. Se o idioma solicitado não for o idioma original, buscar tradução
  if (lang !== post.language_code) {
    const { data: translation, error: transError } = await supabase
      .from('blog_post_translations')
      .select('translated_title, translated_summary, translated_content')
      .eq('post_id', post.id)
      .eq('language_code', lang)
      .single();

    if (transError && transError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.warn(`Translation query error for post ${post.id} in language ${lang}:`, transError);
    }

    if (translation) {
      finalTitle = translation.translated_title;
      finalSummary = translation.translated_summary;
      contentToParse = removeFirstH1(translation.translated_content || '');
      finalLanguageCode = lang;
    }
  }
  
  const parsedContent = await marked.parse(contentToParse);

  return {
    id: post.id,
    slug: post.slug,
    image_url: post.image_url,
    published_at: post.published_at,
    author_id: post.author_id,
    author_first_name: authorProfile?.first_name || null,
    author_last_name: authorProfile?.last_name || null,
    title: finalTitle,
    summary: finalSummary,
    content: parsedContent,
    language_code: finalLanguageCode,
    category_ids,
  };
}

// --- Funções para a Página Inicial ---

export type DailyVerseData = {
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
};

export async function getDailyVerse(lang: string): Promise<DailyVerseData | null> {
  // Define o tempo de revalidação para 24 horas (86400 segundos)
  const supabase = createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Buscar o versículo do dia (já traduzido e com texto)
  // Adicionamos o cache de 24h aqui.
  const { data: dailyVerse, error: dailyVerseError } = await supabase
    .from('daily_verse')
    .select('book, chapter, verse_number, text')
    .eq('date', today)
    .eq('language_code', lang)
    .single()
    .limit(1); // Adiciona limite 1 para garantir que é uma única linha

  if (dailyVerseError || !dailyVerse) {
    console.warn(`Daily verse not found for today (${lang}), fetching fallback reference.`, dailyVerseError?.message);
    
    // 2. Se não encontrar o registro do dia, tentamos buscar uma referência aleatória para o idioma do usuário.
    const { data: fallbackRef, error: fallbackError } = await supabase
      .rpc('get_random_verse', { lang_code: lang })
      .single();
    
    if (fallbackError || !fallbackRef) {
      console.error("Failed to get fallback verse reference:", fallbackError);
      return null;
    }
    
    // 3. Se encontrarmos uma referência, buscamos o texto do versículo na tabela 'verses'
    const { data: verseText, error: verseTextError } = await supabase
      .from('verses')
      .select('text')
      .eq('book', fallbackRef.book)
      .eq('chapter', fallbackRef.chapter)
      .eq('verse_number', fallbackRef.verse_number)
      .eq('language_code', lang)
      .single();

    if (verseTextError || !verseText) {
      console.error("Failed to fetch verse text for fallback reference:", verseTextError);
      return null;
    }
    
    // Retorna o fallback completo
    return {
      book: fallbackRef.book,
      chapter: fallbackRef.chapter,
      verse_number: fallbackRef.verse_number,
      text: verseText.text,
    };
  }

  // 4. Se o registro do dia foi encontrado, retorna-o diretamente
  return dailyVerse as DailyVerseData;
}

export async function getRecentPosts({
  lang,
  limit,
  includeCategorySlug,
  excludeCategorySlug,
}: {
  lang: string;
  limit: number;
  includeCategorySlug?: string;
  excludeCategorySlug?: string;
}): Promise<PostListItem[]> {
  const supabase = createSupabaseServerClient();

  const selectString = `id, slug, title, summary, image_url, published_at, language_code${includeCategorySlug ? ',blog_post_categories!inner(blog_categories!inner(slug))' : ''}`;

  let query = supabase
    .from('blog_posts')
    .select(selectString)
    .eq('status', 'published');

  if (includeCategorySlug) {
    query = query.eq('blog_post_categories.blog_categories.slug', includeCategorySlug);
  }
  
  if (excludeCategorySlug) {
    const { data: categoryToExclude } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', excludeCategorySlug)
      .single();

    if (categoryToExclude) {
      const { data: postsToExclude } = await supabase
        .from('blog_post_categories')
        .select('post_id')
        .eq('category_id', categoryToExclude.id);

      if (postsToExclude && postsToExclude.length > 0) {
        const postIdsToExclude = postsToExclude.map(p => p.post_id);
        query = query.not('id', 'in', `(${postIdsToExclude.join(',')})`);
      }
    }
  }

  query = query.order('published_at', { ascending: false }).limit(limit);

  const { data: originalPosts, error } = await query;

  if (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }

  if (!originalPosts || originalPosts.length === 0) {
    return [];
  }

  // Type assertion to fix TS inference issue with complex Supabase queries
  const typedPosts = originalPosts as unknown as PostListItem[];

  const postIds = typedPosts.map(p => p.id);
  
  let finalPosts: PostListItem[] = typedPosts.map(p => ({
    id: p.id,
    slug: p.slug,
    image_url: p.image_url,
    published_at: p.published_at,
    title: p.title,
    summary: p.summary,
    language_code: p.language_code,
  }));

  if (lang !== 'pt') {
    const { data: translations, error: transError } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (transError) {
      console.error("Error fetching translations for recent posts:", transError);
    } else if (translations) {
      const translationMap = new Map(translations.map(t => [t.post_id, t]));
      finalPosts = finalPosts.map(post => {
        const translation = translationMap.get(post.id);
        if (translation) {
          return {
            ...post,
            title: translation.translated_title,
            summary: translation.translated_summary,
            language_code: translation.language_code,
          };
        }
        return post;
      });
    }
  }

  return finalPosts;
}

// --- Funções para o Admin ---
export type AdminPostListItem = PostListItem & {
  status: string;
  author_first_name: string | null;
  author_last_name: string | null;
};

export async function getAdminPosts(): Promise<AdminPostListItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_admin_blog_posts');

  if (error) {
    console.error('Error fetching admin posts:', error);
    return [];
  }
  return data as AdminPostListItem[];
}

export async function getRelatedPosts({
  postId,
  categoryIds,
  authorId,
  lang,
  limit = 3,
}: {
  postId: string;
  categoryIds: string[];
  authorId: string | null;
  lang: string;
  limit?: number;
}): Promise<PostListItem[]> {
  const supabase = createSupabaseServerClient();
  let relatedPosts: PostListItem[] = [];
  const foundPostIds = new Set<string>([postId]);

  // 1. Find posts by category
  if (categoryIds.length > 0) {
    const { data: postCategoryData, error: pcError } = await supabase
      .from('blog_post_categories')
      .select('post_id')
      .in('category_id', categoryIds)
      .not('post_id', 'eq', postId);

    if (pcError) console.error("Error fetching related post IDs by category:", pcError);

    if (postCategoryData && postCategoryData.length > 0) {
      const postIds = [...new Set(postCategoryData.map(pc => pc.post_id))];
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, slug, title, summary, image_url, published_at, language_code')
        .in('id', postIds)
        .eq('status', 'published')
        .limit(limit);
      
      if (postsError) console.error("Error fetching related posts by category:", postsError);
      
      if (posts) {
        relatedPosts.push(...posts as PostListItem[]);
        posts.forEach(p => foundPostIds.add(p.id));
      }
    }
  }

  // 2. Find posts by author if needed
  if (relatedPosts.length < limit && authorId) {
    const { data: authorPosts, error: authorError } = await supabase
      .from('blog_posts')
      .select('id, slug, title, summary, image_url, published_at, language_code')
      .eq('author_id', authorId)
      .eq('status', 'published')
      .not('id', 'in', `(${Array.from(foundPostIds).join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit - relatedPosts.length);

    if (authorError) console.error("Error fetching related posts by author:", authorError);

    if (authorPosts) {
      relatedPosts.push(...authorPosts as PostListItem[]);
      authorPosts.forEach(p => foundPostIds.add(p.id));
    }
  }

  // 3. Find recent posts if needed
  if (relatedPosts.length < limit) {
    const { data: recentPosts, error: recentError } = await supabase
      .from('blog_posts')
      .select('id, slug, title, summary, image_url, published_at, language_code')
      .eq('status', 'published')
      .not('id', 'in', `(${Array.from(foundPostIds).join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit - relatedPosts.length);

    if (recentError) console.error("Error fetching recent posts:", recentError);

    if (recentPosts) {
      relatedPosts.push(...recentPosts as PostListItem[]);
    }
  }

  // Ensure unique posts and correct limit
  const finalPosts = Array.from(new Map(relatedPosts.map(p => [p.id, p])).values()).slice(0, limit);

  // 4. Handle translations
  if (lang !== 'pt' && finalPosts.length > 0) {
    const postIds = finalPosts.map(p => p.id);
    const { data: translations, error: transError } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (transError) {
      console.error("Error fetching translations for related posts:", transError);
    } else if (translations) {
      const translationMap = new Map(translations.map(t => [t.post_id, t]));
      return finalPosts.map(post => {
        const translation = translationMap.get(post.id);
        if (translation) {
          return {
            ...post,
            title: translation.translated_title,
            summary: translation.translated_summary,
            language_code: translation.language_code,
          };
        }
        return post;
      });
    }
  }

  return finalPosts;
}