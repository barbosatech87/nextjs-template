import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
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

  return {
    title: story.title,
    description: `Web Story sobre ${story.title}`,
    openGraph: {
      title: story.title,
      type: 'article', // Web Stories são tecnicamente artigos
      images: story.poster_image_src ? [story.poster_image_src] : [],
    },
    other: {
        // Indica que esta página é uma AMP Story
        'amp-story': '', 
    }
  };
}

export default async function WebStoryPage({ params }: WebStoryPageProps) {
  const { lang, slug } = await params;
  const story = await getStoryBySlug(slug, lang);

  if (!story) {
    notFound();
  }

  const pages = story.story_data?.pages || [];

  return (
    <>
      {/* Scripts Obrigatórios do AMP */}
      <Script src="https://cdn.ampproject.org/v0.js" strategy="afterInteractive" />
      <Script 
        src="https://cdn.ampproject.org/v0/amp-story-1.0.js" 
        strategy="afterInteractive" 
        custom-element="amp-story" 
      />
      <Script 
        src="https://cdn.ampproject.org/v0/amp-video-0.1.js" 
        strategy="afterInteractive" 
        custom-element="amp-video" 
      />

      {/* Estilos inline específicos para AMP (Boilerplate é injetado pelo Script AMP, mas podemos adicionar custom) */}
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
        publisher-logo-src="https://www.paxword.com/icon-192x192.svg" // URL absoluta necessária
        poster-portrait-src={story.poster_image_src}
      >
        {pages.map((page: any) => (
          <amp-story-page key={page.id} id={page.id}>
            
            {/* Camada de Fundo (Background) */}
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

            {/* Camada de Conteúdo (Livre) */}
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

          </amp-story-page>
        ))}

        {/* Tela Final (Bookend) - Opcional, mas recomendada */}
        <amp-story-bookend src={`/api/stories/bookend?lang=${lang}`} layout="nodisplay" />
        
      </amp-story>
    </>
  );
}