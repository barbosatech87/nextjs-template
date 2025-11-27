import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'pt';

  // Configuração estática do final da Story (Links sociais, etc)
  const bookendConfig = {
    bookendVersion: "v1.0",
    shareProviders: [
      "twitter",
      "email",
      "facebook",
      "whatsapp",
      "linkedin"
    ],
    components: [
      {
        type: "heading",
        text: lang === 'pt' ? "Mais do PaxWord" : "More from PaxWord"
      },
      {
        type: "small",
        title: lang === 'pt' ? "Visite nosso Blog" : "Visit our Blog",
        url: `https://www.paxword.com/${lang}/blog`,
        image: "https://www.paxword.com/icon-192x192.svg"
      },
      {
        type: "cta-link",
        links: [
          {
            text: lang === 'pt' ? "Ler a Bíblia" : "Read the Bible",
            url: `https://www.paxword.com/${lang}/bible`
          }
        ]
      }
    ]
  };

  return NextResponse.json(bookendConfig);
}