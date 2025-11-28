import { createClient } from '@supabase/supabase-js';
import { i18n } from '@/lib/i18n/config';

// Define o tempo de revalidação do cache para 24 horas (em segundos)
export const revalidate = 86400;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const baseUrl = 'https://www.paxword.com';
  
  // Array para armazenar todas as URLs
  const urls = [];

  // 1. Páginas estáticas
  const staticRoutes = ['', '/bible', '/ia-explica', '/plans', '/blog', '/profile', '/auth', '/web-stories'];
  
  for (const locale of i18n.locales) {
    for (const route of staticRoutes) {
      urls.push({
        loc: `${baseUrl}/${locale}${route}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: route === '' ? '1.0' : '0.8'
      });
    }
  }

  // 2. Posts do blog (Originais e Traduções)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, updated_at, language_code')
    .eq('status', 'published');
  
  if (posts) {
    const postIds = posts.map(p => p.id);
    const { data: postTranslations } = await supabase
      .from('blog_post_translations')
      .select('post_id, language_code')
      .in('post_id', postIds);

    const postTransMap = new Map();
    if (postTranslations) {
      postTranslations.forEach(t => {
        if (!postTransMap.has(t.post_id)) postTransMap.set(t.post_id, []);
        postTransMap.get(t.post_id).push(t);
      });
    }

    for (const post of posts) {
      // Original
      urls.push({
        loc: `${baseUrl}/${post.language_code}/blog/${post.slug}`,
        lastmod: post.updated_at ? new Date(post.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.7'
      });

      // Traduções
      const translations = postTransMap.get(post.id);
      if (translations) {
        for (const t of translations) {
          urls.push({
            loc: `${baseUrl}/${t.language_code}/blog/${post.slug}`,
            lastmod: post.updated_at ? new Date(post.updated_at).toISOString() : new Date().toISOString(),
            changefreq: 'monthly',
            priority: '0.7'
          });
        }
      }
    }
  }

  // 3. Páginas públicas (apenas publicadas)
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at, language_code')
    .eq('status', 'published');

  if (pages) {
    for (const page of pages) {
      urls.push({
        loc: `${baseUrl}/${page.language_code}/p/${page.slug}`,
        lastmod: page.updated_at ? new Date(page.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'yearly',
        priority: '0.5'
      });
    }
  }

  // 4. Web Stories (Originais e Traduções)
  const { data: stories } = await supabase
    .from('web_stories')
    .select('id, slug, updated_at, language_code')
    .eq('status', 'published');

  if (stories) {
    const storyIds = stories.map(s => s.id);
    const { data: storyTranslations } = await supabase
        .from('web_story_translations')
        .select('story_id, language_code, updated_at')
        .in('story_id', storyIds);

    const storyTransMap = new Map();
    if (storyTranslations) {
        storyTranslations.forEach(t => {
            if (!storyTransMap.has(t.story_id)) storyTransMap.set(t.story_id, []);
            storyTransMap.get(t.story_id).push(t);
        });
    }

    for (const story of stories) {
      // URL Original
      urls.push({
        loc: `${baseUrl}/${story.language_code}/web-stories/${story.slug}`,
        lastmod: story.updated_at ? new Date(story.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      });

      // URLs das Traduções
      const translations = storyTransMap.get(story.id);
      if (translations) {
          for (const t of translations) {
              urls.push({
                  loc: `${baseUrl}/${t.language_code}/web-stories/${story.slug}`,
                  lastmod: t.updated_at ? new Date(t.updated_at).toISOString() : new Date().toISOString(),
                  changefreq: 'weekly',
                  priority: '0.7'
              });
          }
      }
    }
  }
  
  // 5. Livros e capítulos da Bíblia
  for (const locale of i18n.locales) {
    const { data: bibleMetadata } = await supabase.rpc('get_bible_metadata', { lang_code: locale });
    
    if (bibleMetadata) {
      // @ts-ignore
      for (const book of bibleMetadata) {
        const bookSlug = book.book.toLowerCase().replace(/\s+/g, '-');
        
        urls.push({
          loc: `${baseUrl}/${locale}/bible/${bookSlug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'yearly',
          priority: '0.6'
        });

        for (let i = 1; i <= book.total_chapters; i++) {
          urls.push({
            loc: `${baseUrl}/${locale}/bible/${bookSlug}/${i}`,
            lastmod: new Date().toISOString(),
            changefreq: 'yearly',
            priority: '0.5'
          });
        }
      }
    }
  }

  // Construção do XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}