import { createClient } from '@supabase/supabase-js';

// Usamos um cliente simples aqui para leitura pública
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> }
) {
  const { lang, slug } = await params;

  // 1. Buscar a Story no Banco de Dados
  const { data: story } = await supabase
    .from('web_stories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!story) {
    return new Response('Story not found', { status: 404 });
  }

  // 2. Lógica de Tradução (Manual, já que não estamos usando os hooks do React)
  let title = story.title;
  let storyData = story.story_data;

  if (lang !== story.language_code) {
    const { data: translation } = await supabase
      .from('web_story_translations')
      .select('title, story_data')
      .eq('story_id', story.id)
      .eq('language_code', lang)
      .single();

    if (translation) {
      title = translation.title;
      storyData = translation.story_data;
    }
  }

  const pages = storyData?.pages || [];
  const poster = story.poster_image_src || 'https://www.paxword.com/icon-512x512.svg';

  // 3. Construção do HTML AMP Puro (String Template)
  // Isso evita qualquer processamento do React
  const html = `
    <!doctype html>
    <html amp lang="${lang}">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <link rel="canonical" href="https://www.paxword.com/${lang}/web-stories/${slug}">
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
        <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
        <style amp-custom>
          amp-story { font-family: 'Inter', sans-serif; }
          /* Garante que o texto seja legível */
          .story-text-wrapper { pointer-events: none; }
        </style>
      </head>
      <body>
        <amp-story standalone
            title="${title}"
            publisher="PaxWord"
            publisher-logo-src="https://www.paxword.com/icon-512x512.svg"
            poster-portrait-src="${poster}">
            
            ${pages.map((page: any) => `
              <amp-story-page id="${page.id}">
                
                ${/* Camada de Fundo */''}
                <amp-story-grid-layer template="fill">
                  ${page.backgroundSrc ? 
                    `<amp-img src="${page.backgroundSrc}" width="720" height="1280" layout="responsive" class="object-cover" alt="Background"></amp-img>` : 
                    '<div style="background-color: #000; width: 100%; height: 100%;"></div>'
                  }
                </amp-story-grid-layer>

                ${/* Camada de Elementos (Texto) */''}
                <amp-story-grid-layer template="vertical">
                  ${page.elements.map((element: any) => {
                    if (element.type === 'text') {
                      // Converte estilos React (camelCase) para CSS string (kebab-case) manualmente para o básico
                      // Nota: AMP permite style inline em descendentes de grid-layer
                      return `
                        <div style="
                          position: absolute;
                          top: ${element.style.top};
                          left: ${element.style.left};
                          transform: ${element.style.transform};
                          font-size: ${element.style.fontSize};
                          color: ${element.style.color};
                          background-color: ${element.style.backgroundColor};
                          padding: ${element.style.padding};
                          border-radius: ${element.style.borderRadius};
                          text-align: ${element.style.textAlign};
                          width: ${element.style.width};
                        " class="story-text-wrapper">
                          ${element.content}
                        </div>
                      `;
                    }
                    return '';
                  }).join('')}
                </amp-story-grid-layer>

                ${/* Link Externo (Swipe Up) - Atributo cta-text removido */''}
                ${page.outlink?.href ? `
                  <amp-story-page-outlink layout="nodisplay">
                    <a href="${page.outlink.href}"></a>
                  </amp-story-page-outlink>
                ` : ''}

              </amp-story-page>
            `).join('')}

            <amp-story-bookend src="/api/stories/bookend?lang=${lang}" layout="nodisplay"></amp-story-bookend>
        </amp-story>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' // Cache agressivo para performance
    },
  });
}