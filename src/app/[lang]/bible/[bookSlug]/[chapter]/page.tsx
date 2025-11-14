import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { getBookNameFromSlug, getTranslatedBookName } from '@/lib/bible-translations';
import { VerseDisplay } from '@/components/bible/verse-display';
import { BibleNavigation } from '@/components/bible/bible-navigation';

const pageTexts = {
  pt: {
    bible: "Bíblia",
    previous: "Anterior",
    next: "Próximo",
  },
  en: {
    bible: "Bible",
    previous: "Previous",
    next: "Next",
  },
  es: {
    bible: "Biblia",
    previous: "Anterior",
    next: "Siguiente",
  }
};

interface ChapterPageProps {
  params: { lang: Locale; bookSlug: string; chapter: string };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { lang, bookSlug, chapter } = params;
  const texts = pageTexts[lang] || pageTexts.pt;

  const bookName = getBookNameFromSlug(bookSlug);
  const chapterNumber = parseInt(chapter, 10);

  if (!bookName || isNaN(chapterNumber)) {
    notFound();
  }

  const supabase = createSupabaseServerClient();

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

  return (
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

      <div className="mt-8">
        <VerseDisplay verses={verses || []} />
      </div>

      <div className="mt-8">
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
  );
}