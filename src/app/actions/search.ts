"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { getTranslatedBookName } from "@/lib/bible-translations";
import { Locale } from "@/lib/i18n/config";

export type SearchResult = {
  type: 'verse' | 'blog' | 'book';
  title: string;
  snippet: string;
  url: string;
};

function createSnippet(text: string, query: string): string {
  if (!text) return '';
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  let start = Math.max(0, index - 80);
  let end = Math.min(text.length, index + query.length + 80);

  let snippet = text.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  const regex = new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  snippet = snippet.replace(regex, '<mark>$1</mark>');

  return snippet;
}

export async function searchAll(query: string, lang: string): Promise<SearchResult[]> {
  if (!query) return [];

  const supabase = createSupabaseServerClient();
  const searchPattern = `%${query}%`;

  const verseSearch = supabase
    .from('verses')
    .select('book, chapter, verse_number, text')
    .ilike('text', searchPattern)
    .eq('language_code', lang)
    .limit(10);

  const originalPostSearch = supabase
    .from('blog_posts')
    .select('slug, title, summary, language_code')
    .eq('status', 'published')
    .or(`title.ilike.${searchPattern},summary.ilike.${searchPattern}`)
    .limit(5);

  const translatedPostSearch = supabase
    .from('blog_post_translations')
    .select('post_id, translated_title, translated_summary, language_code, blog_posts(slug)')
    .eq('language_code', lang)
    .or(`translated_title.ilike.${searchPattern},translated_summary.ilike.${searchPattern}`)
    .limit(5);

  const [
    { data: verses, error: verseError },
    { data: originalPosts, error: originalPostError },
    { data: translatedPosts, error: translatedPostError },
  ] = await Promise.all([verseSearch, originalPostSearch, translatedPostSearch]);

  if (verseError) console.error("Verse search error:", verseError);
  if (originalPostError) console.error("Original post search error:", originalPostError);
  if (translatedPostError) console.error("Translated post search error:", translatedPostError);

  const results: SearchResult[] = [];
  const addedBooks = new Set<string>();

  if (verses) {
    verses.forEach(v => {
      const bookSlug = v.book.toLowerCase().replace(/\s+/g, '-');
      results.push({
        type: 'verse',
        title: `${getTranslatedBookName(v.book, lang as Locale)} ${v.chapter}:${v.verse_number}`,
        snippet: createSnippet(v.text, query),
        url: `/${lang}/bible/${bookSlug}/${v.chapter}`,
      });
    });
  }

  const blogResults = new Map<string, SearchResult>();
  if (translatedPosts) {
    translatedPosts.forEach(p => {
      // FIX: A inferência de tipo do Supabase trata a relação como um array.
      if (p.blog_posts && Array.isArray(p.blog_posts) && p.blog_posts[0]?.slug) {
        const slug = p.blog_posts[0].slug;
        blogResults.set(slug, {
          type: 'blog',
          title: p.translated_title,
          snippet: createSnippet(p.translated_summary || '', query),
          url: `/${lang}/blog/${slug}`,
        });
      }
    });
  }
  if (originalPosts) {
    originalPosts.forEach(p => {
      if (!blogResults.has(p.slug) && p.language_code === lang) {
        blogResults.set(p.slug, {
          type: 'blog',
          title: p.title,
          snippet: createSnippet(p.summary || '', query),
          url: `/${lang}/blog/${p.slug}`,
        });
      }
    });
  }
  results.push(...Array.from(blogResults.values()));

  const { data: books, error: bookError } = await supabase.rpc('get_bible_metadata', { lang_code: lang });
  if (bookError) console.error("Book metadata error:", bookError);

  if (books) {
    // FIX: Adiciona o tipo explícito para o parâmetro 'book'.
    books.forEach((book: { book: string; total_chapters: number }) => {
      const translatedName = getTranslatedBookName(book.book, lang as Locale);
      if (translatedName.toLowerCase().includes(query.toLowerCase()) && !addedBooks.has(book.book)) {
        const bookSlug = book.book.toLowerCase().replace(/\s+/g, '-');
        results.push({
          type: 'book',
          title: translatedName,
          snippet: `Explore os ${book.total_chapters} capítulos de ${translatedName}.`,
          url: `/${lang}/bible/${bookSlug}`,
        });
        addedBooks.add(book.book);
      }
    });
  }

  return results;
}