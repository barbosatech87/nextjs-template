"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPost } from "@/types/supabase";

// Tipos para a função de criação
export type NewPostData = Omit<BlogPost, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'status' | 'language_code'> & {
  category_ids: string[];
  status: 'draft' | 'published' | 'archived';
  // Adicionando campos que foram omitidos, mas são necessários no payload
  published_at: string | null;
  scheduled_for: string | null;
};

export async function createPost(postData: NewPostData, lang: string) {
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
    return { success: false, message: "Falha ao criar o post principal." };
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
}

export async function deletePost(postId: string, lang: string) {
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
    return { success: false, message: "Falha ao deletar o post." };
  }

  revalidatePath(`/${lang}/admin/blog`);
  return { success: true, message: "Post deletado com sucesso." };
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
};

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
    .select(`
      id, slug, title, summary, content, image_url, published_at, language_code, author_id,
      profiles (first_name, last_name)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (postError) {
    // Loga o erro detalhado do Supabase
    console.error("Error fetching post by slug:", postError);
    return null;
  }
  
  if (!post) {
    // Se não houver post, retorna null
    return null;
  }

  // Tipagem manual para o perfil do autor, que é um objeto ou null.
  // Usamos 'unknown' para forçar a conversão, já que o Supabase retorna a estrutura correta
  // mas o TypeScript infere um array devido à tipagem padrão de joins.
  const authorProfile = post.profiles as unknown as { first_name: string | null, last_name: string | null } | null;

  const postDetail: PostDetail = {
    id: post.id,
    slug: post.slug,
    image_url: post.image_url,
    published_at: post.published_at,
    author_id: post.author_id,
    author_first_name: authorProfile?.first_name || null,
    author_last_name: authorProfile?.last_name || null,
    title: post.title,
    summary: post.summary,
    content: post.content,
    language_code: post.language_code,
  };

  // 2. Se o idioma solicitado não for o idioma original (pt), buscar tradução
  if (lang !== post.language_code) {
    const { data: translation, error: transError } = await supabase
      .from('blog_post_translations')
      .select('translated_title, translated_summary, translated_content')
      .eq('post_id', post.id)
      .eq('language_code', lang)
      .single();

    if (transError && transError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.warn(`Translation query error for post ${post.id} in language ${lang}:`, transError);
      // Continua com o post original
    }

    if (translation) {
      // Aplica a tradução
      postDetail.title = translation.translated_title;
      postDetail.summary = translation.translated_summary;
      postDetail.content = translation.translated_content;
      postDetail.language_code = lang; // Indica que o conteúdo é traduzido
    }
  }

  return postDetail;
}