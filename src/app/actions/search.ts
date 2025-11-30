"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { getTranslatedBookName, getEnglishBookName } from "@/lib/bible-translations";
import { Locale } from "@/lib/i18n/config";
import DOMPurify from 'isomorphic-dompurify';

export type SearchResult = {
  type: 'verse' | 'blog' | 'book';
  title: string;
  snippet: string;
  url: string;
};

interface ParsedReference {
  book: string;
  chapter: number;
  verse: number;
}

function parseBibleReference(query: string, lang: Locale): ParsedReference | null {
  // Regex para capturar "Livro Capítulo:Versículo"
  const regex = /^(.*?)\s+(\d+)(?::(\d+))?$/;
  const match = query.trim().match(regex);

  if (!match) return null;

  const bookQuery = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : 1; // Padrão para o versículo 1 se não especificado

  const englishBookName = getEnglishBookName(bookQuery, lang);
  if (!englishBookName) return null;

  return { book: englishBookName, chapter, verse };
}

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

  // Sanitize the final snippet, allowing only the <mark> tag
  return DOMPurify.sanitize(snippet, { ALLOWED_TAGS: ['mark'] });
}

export async function searchAll(query: string, lang: Locale): Promise<SearchResult[]> {
  if (!query) return [];

  const supabase = await createSupabaseServerClient();
  const results: SearchResult[] = [];
  const addedVerseKeys = new Set<string>();

  // 1. Tenta buscar por referência específica
  const reference = parseBibleReference(query, lang);
  if (reference) {
    const { data: specificVerse, error } = await supabase
      .from('verses')
      .select('book, chapter, verse_number, text')
      .eq('book', reference.book)
      .eq('chapter', reference.chapter)
      .eq('verse_number', reference.verse)
      .eq('language_code', lang)
      .single();

    if (specificVerse && !error) {
      const bookSlug = specificVerse.book.toLowerCase().replace(/\s+/g, '-');
      const verseKey = `${specificVerse.book}-${specificVerse.chapter}-${specificVerse.verse_number}`;
      if (!addedVerseKeys.has(verseKey)) {
        results.push({
          type: 'verse',
          title: `${getTranslatedBookName(specificVerse.book, lang)} ${specificVerse.chapter}:${specificVerse.verse_number}`,
          snippet: specificVerse.text, // Mostra o texto completo para busca exata
          url: `/${lang}/bible/${bookSlug}/${specificVerse.chapter}`,
        });
        addedVerseKeys.add(verseKey);
      }
    }
  }

  // 2. Continua com a busca por texto completo
  
  // Sanitiza a query removendo aspas duplas para evitar injeção de filtro no PostgREST
  const safeQuery = query.replace(/"/g, '');
  const searchPattern = `%${safeQuery}%`;

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
    // Envolve o padrão em aspas duplas para tratar caracteres especiais (como vírgula) corretamente
    .or(`title.ilike."${searchPattern}",summary.ilike."${searchPattern}"`)
    .limit(5);

  const translatedPostSearch = supabase
    .from('blog_post_translations')
    .select('post_id, translated_title, translated_summary, language_code, blog_posts(slug)')
    .eq('language_code', lang)
    // Envolve o padrão em aspas duplas para tratar caracteres especiais corretamente
    .or(`translated_title.ilike."${searchPattern}",translated_summary.ilike."${searchPattern}"`)
    .limit(5);

  const [
    { data: verses, error: verseError },
    { data: originalPosts, error: originalPostError },
    { data: translatedPosts, error: translatedPostError },
  ] = await Promise.all([verseSearch, originalPostSearch, translatedPostSearch]);

  if (verseError) console.error("Verse search error:", verseError);
  if (originalPostError) console.error("Original post search error:", originalPostError);
  if (translatedPostError) console.error("Translated post search error:", translatedPostError);

  // Adiciona resultados da busca por texto de versículos (evitando duplicatas)
  if (verses) {
    verses.forEach(v => {
      const verseKey = `${v.book}-${v.chapter}-${v.verse_number}`;
      if (!addedVerseKeys.has(verseKey)) {
        const bookSlug = v.book.toLowerCase().replace(/\s+/g, '-');
        results.push({
          type: 'verse',
          title: `${getTranslatedBookName(v.book, lang)} ${v.chapter}:${v.verse_number}`,
          snippet: createSnippet(v.text, query),
          url: `/${lang}/bible/${bookSlug}/${v.chapter}`,
        });
        addedVerseKeys.add(verseKey);
      }
    });
  }

  // Adiciona resultados de blog
  const blogResults = new Map<string, SearchResult>();
  if (translatedPosts) {
    translatedPosts.forEach(p => {
      const blogPostData = Array.isArray(p.blog_posts) ? p.blog_posts[0] : p.blog_posts;
      if (blogPostData && blogPostData.slug) {
        const slug = blogPostData.slug;
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

  // Adiciona resultados de livros
  const { data: books, error: bookError } = await supabase.rpc('get_bible_metadata', { lang_code: lang });
  if (bookError) console.error("Book metadata error:", bookError);

  if (books) {
    const addedBooks = new Set<string>();
    books.forEach((book: { book: string; total_chapters: number }) => {
      const translatedName = getTranslatedBookName(book.book, lang);
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