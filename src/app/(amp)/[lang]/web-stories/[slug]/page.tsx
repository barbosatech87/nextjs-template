import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoryBySlug } from '@/app/actions/stories';
import { Locale } from '@/lib/i18n/config';

interface WebStoryPageProps {
  params: Promise<{ lang: Locale; slug: string }>;
}

export async function generateMetadata(
  { params }: WebStoryPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { lang, slug } = await params;
  const story = await getStoryBySlug(slug, lang);

  if (!story) {
    return { title: 'Story não encontrada' };
  }

  const description = `Web Story sobre ${story.title}. Explore conteúdos visuais no PaxWord.`;
  const imageUrl = story.poster_image_src || 'https://www.paxword.com/social-share.png';

  return {
    title: story.title,
    description: description,
    openGraph: {
      title: story.title,
      description: description,
      type: 'article',
      url: `https://www.paxword.com/${lang}/web-stories/${slug}`,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function WebStoryPage({ params }: WebStoryPageProps) {
  const { lang, slug } = await params;
  const story = await getStoryBySlug(slug, lang);

  if (!story) {
    notFound();
  }

  const pages = story.story_data?.pages || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.paxword.com/${lang}/web-stories/${slug}`,
    },
    'headline': story.title,
    'image': story.poster_image_src ? [story.poster_image_src] : [],
    'datePublished': story.published_at,
    'dateModified': story.updated_at,
    'author': {
      '@type': 'Organization',
      'name': 'PaxWord',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'PaxWord',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.paxword.com/icon-512x512.svg',
      },
    },
  };

  return (
    <>
      {/* Scripts são injetados pelo RootLayout quando isAmp=true */}
      
      {/* Dados Estruturados para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Estilos inline específicos para AMP */}
      <style dangerouslySetInnerHTML={{
        __html: `
          amp-story { font-family: 'Inter', sans-serif; }
          .story-text { pointer-events: none; } 
        `
      }} />

      <amp-story
        standalone=""
        title={story.title}
        publisher="PaxWord"
        publisher-logo-src="https://www.paxword.com/icon-192x192.svg"
        poster-portrait-src={story.poster_image_src}
      >
        {pages.map((page: any) => (
          <amp-story-page key={page.id} id={page.id}>
            
            <amp-story-grid-layer template="fill">
              {page.backgroundSrc && (
                <amp-img
                  src={page.backgroundSrc}
                  width="720"
                  height="1280"
                  layout="responsive"
                  alt="Background image"
                  className="object-cover"
                />
              )}
            </amp-story-grid-layer>

            <amp-story-grid-layer>
              {page.elements.map((element: any) => {
                if (element.type === 'text') {
                  return (
                    <div
                      key={element.id}
                      style={{
                        ...element.style,
                        position: 'absolute',
                      }}
                      dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                  );
                }
                return null;
              })}
            </amp-story-grid-layer>

            {page.outlink?.href && (
              <amp-story-page-outlink layout="nodisplay" cta-text={page.outlink.ctaText || 'Saiba Mais'}>
                <a href={page.outlink.href} target="_blank" rel="noopener noreferrer"></a>
              </amp-story-page-outlink>
            )}

          </amp-story-page>
        ))}

        <amp-story-bookend src={`/api/stories/bookend?lang=${lang}`} layout="nodisplay" />
        
      </amp-story>
    </>
  );
}