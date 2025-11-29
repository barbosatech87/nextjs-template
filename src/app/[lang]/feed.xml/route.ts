import RSS from 'rss';
import { createClient } from '@supabase/supabase-js';
import { i18n, Locale } from '@/lib/i18n/config';

// Define o tempo de cache para 24 horas (em segundos)
export const revalidate = 86400;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: Locale }> }
) {
  const { lang } = await params;

  if (!i18n.locales.includes(lang)) {
    return new Response('Locale not supported', { status: 404 });
  }

  // Cliente Supabase para dados públicos
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const siteUrl = 'https://www.paxword.com';
  const feedUrl = `${siteUrl}/${lang}/feed.xml`;

  // Configuração do Feed baseada no idioma
  const feedDescriptions = {
    pt: 'Explore a Palavra de Deus com Estudos e Devocionais',
    en: 'Explore God\'s Word with Studies and Devotionals',
    es: 'Explora la Palabra de Dios con Estudios y Devocionales'
  };

  const feedOptions = {
    title: 'PaxWord',
    description: feedDescriptions[lang] || feedDescriptions.pt,
    site_url: `${siteUrl}/${lang}`,
    feed_url: feedUrl,
    language: lang,
    image_url: `${siteUrl}/icon-512x512.svg`,
    copyright: `© ${new Date().getFullYear()} PaxWord`,
    generator: 'PaxWord RSS Generator',
  };

  const feed = new RSS(feedOptions);

  // Buscar últimos 20 posts publicados
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, summary, published_at, language_code')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('RSS Feed Error:', error);
    return new Response('Error generating feed', { status: 500 });
  }

  let finalPosts = posts || [];

  // Se não for PT, buscar traduções disponíveis
  if (lang !== 'pt' && finalPosts.length > 0) {
    const postIds = finalPosts.map(p => p.id);
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

  // Textos para o rodapé de proteção/copyright
  const protectionTexts = {
    pt: {
      appearedFirst: 'O post',
      appearedFirst2: 'apareceu primeiro em',
      rights: 'Todos os direitos reservados. Uso não autorizado é proibido.',
      readMore: 'Leia o artigo completo no PaxWord'
    },
    en: {
      appearedFirst: 'The post',
      appearedFirst2: 'appeared first on',
      rights: 'All rights reserved. Unauthorized use is prohibited.',
      readMore: 'Read the full article on PaxWord'
    },
    es: {
      appearedFirst: 'La entrada',
      appearedFirst2: 'apareció primero en',
      rights: 'Todos los derechos reservados. Se prohíbe el uso no autorizado.',
      readMore: 'Lee el artículo completo en PaxWord'
    }
  };

  const t = protectionTexts[lang] || protectionTexts.pt;

  // Adicionar itens ao feed
  finalPosts.forEach(post => {
    const postUrl = `${siteUrl}/${lang}/blog/${post.slug}`;
    
    // Monta a descrição com proteção de conteúdo
    // Inclui resumo, link para ler mais e aviso de copyright com backlinks forçados
    const customDescription = `
      <p>${post.summary || ''}</p>
      <p><strong><a href="${postUrl}">${t.readMore}</a></strong></p>
      <hr />
      <p><small>${t.appearedFirst} <a href="${postUrl}">${post.title}</a> ${t.appearedFirst2} <a href="${siteUrl}/${lang}">PaxWord</a>.</small></p>
      <p><small>© ${new Date().getFullYear()} PaxWord. ${t.rights}</small></p>
    `;

    feed.item({
      title: post.title,
      description: customDescription,
      url: postUrl,
      guid: post.id,
      date: post.published_at || new Date().toISOString(),
      author: 'PaxWord',
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}