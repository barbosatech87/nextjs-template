import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { getBookNameFromSlug, getTranslatedBookName } from '@/lib/bible-translations';
import { VerseDisplay } from '@/components/bible/verse-display';
import { BibleNavigation } from '@/components/bible/bible-navigation';
import { ShareButtons } from '@/components/social/share-buttons';
import { Metadata, ResolvingMetadata } from "next";

const pageTexts = {
  pt: {
    bible: "Bíblia",
    previous: "Anterior",
    next: "Próximo",
    shareTitle: "Leitura de",
    shareSummary: "Leia o capítulo {chapter} de {book} na íntegra no PaxWord.",
    home: "Início",
    chapterLabel: "Capítulo",
    holyBible: "A Bíblia Sagrada",
  },
  en: {
    bible: "Bible",
    previous: "Previous",
    next: "Next",
    shareTitle: "Reading",
    shareSummary: "Read chapter {chapter} of {book} in full on PaxWord.",
    home: "Home",
    chapterLabel: "Chapter",
    holyBible: "The Holy Bible",
  },
  es: {
    bible: "Biblia",
    previous: "Anterior",
    next: "Siguiente",
    shareTitle: "Lectura de",
    shareSummary: "Lee el capítulo {chapter} de {book} completo en PaxWord.",
    home: "Inicio",
    chapterLabel: "Capítulo",
    holyBible: "La Santa Biblia",
  }
};

interface ChapterPageProps {
  params: Promise<{ lang: Locale; bookSlug: string; chapter: string }>;
}

export async function generateMetadata(
  { params }: ChapterPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { lang, bookSlug, chapter } = await params;
  const bookName = getBookNameFromSlug(bookSlug);
  
  if (!bookName) {
    return {
      title: "Capítulo não encontrado",
    };
  }

  const translatedBookName = getTranslatedBookName(bookName, lang);
  const title = `Leitura de ${translatedBookName} ${chapter} - PaxWord`;
  const description = `Leia o capítulo ${chapter} do livro de ${translatedBookName} na íntegra. Explore a Palavra de Deus no PaxWord.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${lang}/bible/${bookSlug}/${chapter}`,
      images: [
        {
          url: '/social-share.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/social-share.png'],
    },
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { lang, bookSlug, chapter } = await params;
  const texts = pageTexts[lang] || pageTexts.pt;

  const bookName = getBookNameFromSlug(bookSlug);
  const chapterNumber = parseInt(chapter, 10);

  if (!bookName || isNaN(chapterNumber)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  // Fetch verses for the current chapter
  const { data: verses, error: versesError } = await supabase
    .from('verses')
    .select('verse_number, text')
    .eq('book', bookName)
    .eq('chapter', chapterNumber)
    .eq('language_code', lang)
    .order('verse_number', { ascending: true });

  // Fetch total chapters for navigation
  const { data: chapterData, error: chapterError } = await supabase
    .from('verses')
    .select('chapter')
    .eq('book', bookName)
    .eq('language_code', lang)
    .order('chapter', { ascending: false })
    .limit(1)
    .single();

  if (versesError || chapterError || !chapterData) {
    console.error("Error fetching chapter data:", { versesError, chapterError });
    notFound();
  }

  const totalChapters = chapterData.chapter;
  const translatedBookName = getTranslatedBookName(bookName, lang);

  const shareTitle = `${texts.shareTitle} ${translatedBookName} ${chapterNumber}`;
  const shareSummary = texts.shareSummary.replace('{chapter}', chapter).replace('{book}', translatedBookName);
  const sharePath = `bible/${bookSlug}/${chapter}`;

  // --- Dados Estruturados (JSON-LD) ---
  const baseUrl = 'https://www.paxword.com';
  const fullUrl = `${baseUrl}/${lang}/bible/${bookSlug}/${chapter}`;

  const chapterSchema = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    'name': `${texts.shareTitle} ${translatedBookName} ${chapterNumber}`,
    'chapterNumber': chapterNumber,
    'isPartOf': {
      '@type': 'Book',
      'name': translatedBookName,
      'isPartOf': {
        '@type': 'BookSeries',
        'name': texts.holyBible,
        'url': `${baseUrl}/${lang}/bible`
      }
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': texts.home,
        'item': `${baseUrl}/${lang}`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': texts.bible,
        'item': `${baseUrl}/${lang}/bible`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': translatedBookName,
        'item': `${baseUrl}/${lang}/bible/${bookSlug}`
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': `${texts.chapterLabel} ${chapterNumber}`,
        'item': fullUrl
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([chapterSchema, breadcrumbSchema]) }}
      />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <BibleNavigation
          lang={lang}
          bookName={translatedBookName}
          bookSlug={bookSlug}
          chapter={chapterNumber}
          totalChapters={totalChapters}
          texts={texts}
        />
        
        <header className="text-center my-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{translatedBookName} {chapterNumber}</h1>
        </header>

        <ShareButtons
          title={shareTitle}
          summary={shareSummary}
          path={sharePath}
          lang={lang}
          className="mb-8"
        />

        <div className="mt-8">
          <VerseDisplay verses={verses || []} />
        </div>

        <div className="mt-8">
          <ShareButtons
            title={shareTitle}
            summary={shareSummary}
            path={sharePath}
            lang={lang}
            className="my-8"
          />
          <BibleNavigation
            lang={lang}
            bookName={translatedBookName}
            bookSlug={bookSlug}
            chapter={chapterNumber}
            totalChapters={totalChapters}
            texts={texts}
          />
        </div>
      </main>
    </>
  );
}