import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/integrations/supabase/server'
import { i18n } from '@/lib/i18n/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServerClient()
  const baseUrl = 'https://www.paxword.com' // Idealmente, isso viria de uma variável de ambiente

  // 1. Páginas estáticas
  const staticRoutes = ['', '/bible', '/ia-explica', '/plans', '/blog', '/profile', '/auth']
  const staticUrls = i18n.locales.flatMap(locale =>
    staticRoutes.map(route => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as 'weekly',
      priority: route === '' ? 1.0 : 0.8,
    }))
  )

  // 2. Posts do blog
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, language_code')
    .eq('status', 'published')
  
  const postUrls = posts?.map(post => ({
    url: `${baseUrl}/${post.language_code}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || new Date()),
    changeFrequency: 'monthly' as 'monthly',
    priority: 0.7,
  })) ?? []

  // 3. Páginas públicas
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, updated_at, language_code')
    .eq('status', 'published')

  const pageUrls = pages?.map(page => ({
    url: `${baseUrl}/${page.language_code}/p/${page.slug}`,
    lastModified: new Date(page.updated_at || new Date()),
    changeFrequency: 'yearly' as 'yearly',
    priority: 0.5,
  })) ?? []
  
  // 4. Livros e capítulos da Bíblia
  const bibleUrls: MetadataRoute.Sitemap = [];
  for (const locale of i18n.locales) {
    const { data: bibleMetadata } = await supabase.rpc('get_bible_metadata', { lang_code: locale });
    
    if (bibleMetadata) {
      for (const book of bibleMetadata) {
        const bookSlug = book.book.toLowerCase().replace(/\s+/g, '-');
        // Adiciona URL do livro
        bibleUrls.push({
          url: `${baseUrl}/${locale}/bible/${bookSlug}`,
          lastModified: new Date(),
          changeFrequency: 'yearly' as 'yearly',
          priority: 0.6,
        });
        // Adiciona URLs dos capítulos
        for (let i = 1; i <= book.total_chapters; i++) {
          bibleUrls.push({
            url: `${baseUrl}/${locale}/bible/${bookSlug}/${i}`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as 'yearly',
            priority: 0.5,
          });
        }
      }
    }
  }

  return [
    ...staticUrls,
    ...postUrls,
    ...pageUrls,
    ...bibleUrls,
  ]
}