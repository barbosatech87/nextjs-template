"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { BlogPost } from "@/types/supabase";
import { marked } from 'marked';
import { createClient } from "@supabase/supabase-js";
import { triggerNewPostNotification } from './notifications';
import sanitizeHtml from 'sanitize-html';

const POSTS_PER_PAGE = 9;

// Configuração do sanitizador
const sanitizeConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe', 'img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class'], // Permite classes para o Tailwind Typography
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
    a: [...sanitizeHtml.defaults.allowedAttributes.a, 'rel'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
};

// Cliente Supabase para dados públicos (dentro do cache)
const getPublicClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Helper function to remove the first H1 from markdown content
function removeFirstH1(markdown: string): string {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  const firstLineIndex = lines.findIndex(line => line.trim() !== '');
  if (firstLineIndex === -1) return markdown;

  if (lines[firstLineIndex].trim().startsWith('# ')) {
    lines.splice(firstLineIndex, 1);
    return lines.join('\n');
  }
  return markdown;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export type NewPostData = Omit<BlogPost, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'status' | 'language_code'> & {
  category_ids: string[];
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  scheduled_for: string | null;
  image_alt_text: string | null;
};

type CreatePostSuccess = {
  success: true;
  message: string;
  postId: string;
  postContent: { title: string; summary: string | null; content: string };
};

type ActionResponse = CreatePostSuccess | { success: false; message: string; };

export async function createPost(postData: NewPostData, lang: string): Promise<ActionResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    
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

    const { data: newPost, error: postError } = await supabase
      .from("blog_posts")
      .insert({
        ...postDetails,
        author_id: user.id,
        language_code: lang,
      })
      .select('id, title, summary, content, slug') // Adicionado slug
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      return { success: false, message: `Falha ao criar o post principal: ${postError.message}` };
    }

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
      }
    }

    // Dispara notificação se o post for publicado
    if (postDetails.status === 'published') {
      triggerNewPostNotification(newPost.id, newPost.title, newPost.slug, lang);
    }

    revalidatePath(`/${lang}/admin/blog`);
    revalidatePath(`/${lang}`); 
    revalidatePath(`/${lang}/blog`);
    
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
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    const { data: postBeforeUpdate, error: fetchError } = await supabase
      .from('blog_posts')
      .select('author_id, status')
      .eq('id', postId)
      .single();

    if (fetchError || !postBeforeUpdate) {
      return { success: false, message: "Post não encontrado." };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'writer' && postBeforeUpdate.author_id !== user.id) {
      return { success: false, message: "Acesso negado. Você não é o autor deste post." };
    } else if (profile?.role !== 'admin' && profile?.role !== 'writer') {
      return { success: false, message: "Acesso negado." };
    }

    const { category_ids, ...postDetails } = postData;

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

    // Dispara notificação se o post mudou de status para 'published'
    if (postDetails.status === 'published' && postBeforeUpdate.status !== 'published') {
      triggerNewPostNotification(postId, postDetails.title, postDetails.slug, lang);
    }

    const { error: deleteError } = await supabase
      .from('blog_post_categories')
      .delete()
      .eq('post_id', postId);

    if (deleteError) {
      console.error("Error deleting existing categories:", deleteError);
    }

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
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}/blog`);

    return { success: true, message: "Post atualizado com sucesso." };
  } catch (e) {
    console.error("Unexpected error in updatePost:", e);
    return { success: false, message: "Ocorreu um erro inesperado ao atualizar o post." };
  }
}

export async function deletePost(postId: string, lang: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuário não autenticado." };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

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
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}/blog`);
    
    return { success: true, message: "Post deletado com sucesso." };
  } catch (e) {
    console.error("Unexpected error in deletePost:", e);
    return { success: false, message: "Ocorreu um erro inesperado ao deletar o post." };
  }
}

export type PostListItem = {
  id: string;
  slug: string;
  image_url: string | null;
  image_alt_text: string | null;
  published_at: string | null;
  title: string;
  summary: string | null;
  language_code: string;
};

export type PostDetail = {
  id: string;
  slug: string;
  image_url: string | null;
  image_alt_text: string | null;
  published_at: string | null;
  updated_at: string | null;
  author_id: string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  title: string;
  summary: string | null;
  content: string;
  language_code: string;
  categories: { id: string; name: string; slug: string }[];
};

export type EditablePostData = Omit<BlogPost, 'author_id' | 'created_at' | 'updated_at'> & {
  category_ids: string[];
  image_alt_text: string | null;
};

export async function getPostById(postId: string): Promise<EditablePostData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    console.error("Error fetching post by ID:", postError);
    return null;
  }

  const { data: postCategories, error: categoryError } = await supabase
    .from('blog_post_categories')
    .select('category_id')
    .eq('post_id', postId);

  if (categoryError) {
    console.error("Error fetching post categories:", categoryError);
  }

  const category_ids = postCategories ? postCategories.map(pc => pc.category_id) : [];

  const { author_id, created_at, updated_at, ...rest } = post;

  return {
    ...rest,
    category_ids,
  } as EditablePostData;
}

export async function getPublishedPosts(lang: string, page: number = 1) {
  const supabase = await createSupabaseServerClient();
  const offset = (page - 1) * POSTS_PER_PAGE;

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, summary, image_url, image_alt_text, published_at, language_code', { count: 'exact' })
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
  
  let finalPosts: PostListItem[] = originalPosts.map(p => ({
    id: p.id,
    slug: p.slug,
    image_url: p.image_url,
    image_alt_text: p.image_alt_text,
    published_at: p.published_at,
    title: p.title,
    summary: p.summary,
    language_code: p.language_code,
  }));

  if (lang !== 'pt') {
    const { data: translations } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (translations) {
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

  const totalPages = count ? Math.ceil(count / POSTS_PER_PAGE) : 0;

  return { 
    posts: finalPosts, 
    totalPages, 
    currentPage: page 
  };
}

export const getPostBySlug = unstable_cache(
  async (slug: string, lang: string): Promise<PostDetail> => {
    const supabase = getPublicClient();

    const { data: post, error: rpcError } = await supabase
      .rpc('get_public_post_details', { p_slug: slug })
      .single();

    if (rpcError || !post) {
      throw new Error(`Post not found: ${slug}`);
    }

    let contentToParse = removeFirstH1(post.content || '');
    let finalLanguageCode = post.language_code;
    let finalTitle = post.title;
    let finalSummary = post.summary;

    if (lang !== post.language_code) {
      const { data: translation } = await supabase
        .from('blog_post_translations')
        .select('translated_title, translated_summary, translated_content')
        .eq('post_id', post.id)
        .eq('language_code', lang)
        .single();

      if (translation) {
        finalTitle = translation.translated_title;
        finalSummary = translation.translated_summary;
        contentToParse = removeFirstH1(translation.translated_content || '');
        finalLanguageCode = lang;
      }
    }
    
    const parsedContent = await marked.parse(contentToParse);
    const sanitizedContent = sanitizeHtml(parsedContent, sanitizeConfig);

    const finalPost: PostDetail = {
      id: post.id,
      slug: post.slug,
      image_url: post.image_url,
      image_alt_text: post.image_alt_text,
      published_at: post.published_at,
      updated_at: post.updated_at,
      author_id: post.author_id,
      author_first_name: post.author_first_name,
      author_last_name: post.author_last_name,
      title: finalTitle,
      summary: finalSummary,
      content: sanitizedContent,
      language_code: finalLanguageCode,
      categories: (post.categories as unknown as any[]) || [],
    };

    if (!finalPost) {
      throw new Error(`Failed to construct post object for slug: ${slug}`);
    }

    return finalPost;
  },
  ['post-by-slug'],
  { revalidate: 3600, tags: ['blog'] }
);

export type DailyVerseData = {
  book: string;
  chapter: number;
  verse_number: number;
  text: string;
};

interface VerseReference {
    book: string;
    chapter: number;
    verse_number: number;
    version: string;
}

export const getDailyVerse = unstable_cache(
  async (lang: string): Promise<DailyVerseData> => {
    const supabase = getPublicClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: dailyVerse, error: dailyVerseError } = await supabase
      .from('daily_verse')
      .select('book, chapter, verse_number, text')
      .eq('date', today)
      .eq('language_code', lang)
      .single();

    if (!dailyVerseError && dailyVerse) {
      return dailyVerse as DailyVerseData;
    }

    // Fallback logic
    let refLang = lang;
    const { data: fallbackRefPrimary } = await supabase
      .rpc('get_random_verse', { lang_code: lang })
      .maybeSingle();

    let typedFallbackRef = fallbackRefPrimary as VerseReference | null;

    if (!typedFallbackRef) {
      const { data: fallbackRefPt } = await supabase
        .rpc('get_random_verse', { lang_code: 'pt' })
        .maybeSingle();
      if (fallbackRefPt) {
        typedFallbackRef = fallbackRefPt as VerseReference;
        refLang = 'pt';
      }
    }
    
    if (!typedFallbackRef) {
      throw new Error("Could not find any verse for daily verse fallback.");
    }
    
    const { data: verseText } = await supabase
      .from('verses')
      .select('text')
      .eq('book', typedFallbackRef.book)
      .eq('chapter', typedFallbackRef.chapter)
      .eq('verse_number', typedFallbackRef.verse_number)
      .eq('language_code', refLang)
      .single();

    if (!verseText) {
      throw new Error("Could not find verse text for daily verse fallback.");
    }
    
    return {
      book: typedFallbackRef.book,
      chapter: typedFallbackRef.chapter,
      verse_number: typedFallbackRef.verse_number,
      text: verseText.text,
    };
  },
  ['daily-verse'],
  { revalidate: 14400, tags: ['daily-verse'] }
);

export const getRecentPosts = unstable_cache(
  async ({
    lang,
    limit,
    includeCategorySlug,
    excludeCategorySlug,
  }: {
    lang: string;
    limit: number;
    includeCategorySlug?: string;
    excludeCategorySlug?: string;
  }): Promise<PostListItem[]> => {
    const supabase = getPublicClient();

    const selectString = `id, slug, title, summary, image_url, image_alt_text, published_at, language_code${includeCategorySlug ? ',blog_post_categories!inner(blog_categories!inner(slug))' : ''}`;

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
      throw new Error(`Database error while fetching recent posts: ${error.message}`);
    }

    if (!originalPosts) {
      return [];
    }

    const typedPosts = originalPosts as unknown as PostListItem[];
    const postIds = typedPosts.map(p => p.id);
    
    let finalPosts: PostListItem[] = typedPosts.map(p => ({
      id: p.id,
      slug: p.slug,
      image_url: p.image_url,
      image_alt_text: p.image_alt_text,
      published_at: p.published_at,
      title: p.title,
      summary: p.summary,
      language_code: p.language_code,
    }));

    if (lang !== 'pt') {
      const { data: translations } = await supabase
        .from('blog_post_translations')
        .select('post_id, translated_title, translated_summary, language_code')
        .in('post_id', postIds)
        .eq('language_code', lang);

      if (translations) {
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
  },
  ['recent-posts'],
  { revalidate: 3600, tags: ['blog'] }
);

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
  const supabase = await createSupabaseServerClient();
  let relatedPosts: PostListItem[] = [];
  const foundPostIds = new Set<string>([postId]);

  if (categoryIds.length > 0) {
    const { data: availablePostsData } = await supabase
      .from('blog_posts')
      .select('id, blog_post_categories!inner(category_id)')
      .eq('status', 'published')
      .in('blog_post_categories.category_id', categoryIds)
      .not('id', 'eq', postId);

    if (availablePostsData && availablePostsData.length > 0) {
      let postIds = [...new Set(availablePostsData.map(p => p.id))];
      postIds = shuffleArray(postIds);
      const selectedIds = postIds.slice(0, limit);

      if (selectedIds.length > 0) {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('id, slug, title, summary, image_url, image_alt_text, published_at, language_code')
          .in('id', selectedIds);
        
        if (posts) {
           const shuffledPosts = shuffleArray(posts as PostListItem[]);
           relatedPosts.push(...shuffledPosts);
           posts.forEach(p => foundPostIds.add(p.id));
        }
      }
    }
  }

  if (relatedPosts.length < limit && authorId) {
    const { data: authorPosts } = await supabase
      .from('blog_posts')
      .select('id, slug, title, summary, image_url, image_alt_text, published_at, language_code')
      .eq('author_id', authorId)
      .eq('status', 'published')
      .not('id', 'in', `(${Array.from(foundPostIds).join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit - relatedPosts.length);

    if (authorPosts) {
      relatedPosts.push(...authorPosts as PostListItem[]);
      authorPosts.forEach(p => foundPostIds.add(p.id));
    }
  }

  if (relatedPosts.length < limit) {
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('id, slug, title, summary, image_url, image_alt_text, published_at, language_code')
      .eq('status', 'published')
      .not('id', 'in', `(${Array.from(foundPostIds).join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit - relatedPosts.length);

    if (recentPosts) {
      relatedPosts.push(...recentPosts as PostListItem[]);
    }
  }

  const finalPosts = Array.from(new Map(relatedPosts.map(p => [p.id, p])).values()).slice(0, limit);

  if (lang !== 'pt' && finalPosts.length > 0) {
    const postIds = finalPosts.map(p => p.id);
    const { data: translations } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (translations) {
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

export type AdminPostListItem = PostListItem & {
  status: string;
  author_first_name: string | null;
  author_last_name: string | null;
};

export async function getAdminPosts(): Promise<AdminPostListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_admin_blog_posts');

  if (error) {
    console.error('Error fetching admin posts:', error);
    return [];
  }
  return data as AdminPostListItem[];
}

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data as BlogCategory[];
}

export async function getPublishedPostsByCategory(lang: string, categorySlug: string, page: number = 1) {
  const supabase = await createSupabaseServerClient();
  const offset = (page - 1) * POSTS_PER_PAGE;

  const { data: category, error: categoryError } = await supabase
    .from('blog_categories')
    .select('id, name')
    .eq('slug', categorySlug)
    .single();

  if (categoryError || !category) {
    return { posts: [], totalPages: 0, currentPage: page, categoryName: null };
  }

  const { data: originalPosts, count, error: postsError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, summary, image_url, image_alt_text, published_at, language_code, blog_post_categories!inner(category_id)', { count: 'exact' })
    .eq('status', 'published')
    .eq('blog_post_categories.category_id', category.id)
    .order('published_at', { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1);

  if (postsError) {
    return { posts: [], totalPages: 0, currentPage: page, categoryName: category.name };
  }

  if (!originalPosts || originalPosts.length === 0) {
    return { posts: [], totalPages: 0, currentPage: page, categoryName: category.name };
  }

  const postIds = originalPosts.map(p => p.id);
  
  let finalPosts: PostListItem[] = originalPosts.map(p => ({
    id: p.id,
    slug: p.slug,
    image_url: p.image_url,
    image_alt_text: p.image_alt_text,
    published_at: p.published_at,
    title: p.title,
    summary: p.summary,
    language_code: p.language_code,
  }));

  if (lang !== 'pt') {
    const { data: translations } = await supabase
      .from('blog_post_translations')
      .select('post_id, translated_title, translated_summary, language_code')
      .in('post_id', postIds)
      .eq('language_code', lang);

    if (translations) {
      const translationMap = new Map(translations.map(t => [t.post_id, t]));
      finalPosts = finalPosts.map(post => {
        const translation = translationMap.get(post.id);
        return translation ? { ...post, title: translation.translated_title, summary: translation.translated_summary, language_code: translation.language_code } : post;
      });
    }
  }

  const totalPages = count ? Math.ceil(count / POSTS_PER_PAGE) : 0;

  return { 
    posts: finalPosts, 
    totalPages, 
    currentPage: page,
    categoryName: category.name,
  };
}