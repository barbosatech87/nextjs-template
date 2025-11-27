import { createClient } from '@supabase/supabase-js';
import { i18n } from '@/lib/i18n/config';

// Define o tempo de revalidação do cache para 24 horas (em segundos)
// Isso significa que o sitemap será gerado no máximo uma vez por dia
export const revalidate = 86400;

export async function GET() {
  // Usamos um cliente simples aqui pois não precisamos de cookies/sessão de usuário
  // para gerar o sitemap público. Isso evita que a rota se torne dinâmica por request.
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

  // 2. Posts do blog (apenas publicados)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, language_code')
    .eq('status', 'published');
  
  if (posts) {
    for (const post of posts) {
      urls.push({
        loc: `${baseUrl}/${post.language_code}/blog/${post.slug}`,
        lastmod: post.updated_at ? new Date(post.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'monthly',
        priority: '0.7'
      });
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

  // 4. Web Stories (apenas publicadas)
  const { data: stories } = await supabase
    .from('web_stories')
    .select('slug, updated_at, language_code')
    .eq('status', 'published');

  if (stories) {
    for (const story of stories) {
      urls.push({
        loc: `${baseUrl}/${story.language_code}/web-stories/${story.slug}`,
        lastmod: story.updated_at ? new Date(story.updated_at).toISOString() : new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.7'
      });
    }
  }
  
  // 5. Livros e capítulos da Bíblia
  // Como são muitos dados, fazemos isso para cada idioma
  for (const locale of i18n.locales) {
    const { data: bibleMetadata } = await supabase.rpc('get_bible_metadata', { lang_code: locale });
    
    if (bibleMetadata) {
      // @ts-ignore - O tipo retornado pelo RPC pode não estar inferido corretamente aqui
      for (const book of bibleMetadata) {
        const bookSlug = book.book.toLowerCase().replace(/\s+/g, '-');
        
        // URL do livro
        urls.push({
          loc: `${baseUrl}/${locale}/bible/${bookSlug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'yearly',
          priority: '0.6'
        });

        // URLs dos capítulos
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
      // Cache control headers adicionais para navegadores/CDNs
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}