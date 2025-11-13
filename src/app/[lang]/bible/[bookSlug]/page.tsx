import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { AppPageProps } from '@/types/app';
import { getBookNameFromSlug, getTranslatedBookName } from '@/lib/bible-translations';
import { ChapterSelection } from '@/components/bible/chapter-selection';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';

const pageTexts = {
  pt: {
    bible: "Bíblia",
    title: "Escolha o Capítulo",
    error: "Livro não encontrado."
  },
  en: {
    bible: "Bible",
    title: "Choose a Chapter",
    error: "Book not found."
  },
  es: {
    bible: "Biblia",
    title: "Elige el Capítulo",
    error: "Libro no encontrado."
  }
};

export default async function BookPage({ params }: AppPageProps<{ lang: Locale; bookSlug: string }>) {
  const { lang, bookSlug } = params;
  const texts = pageTexts[lang] || pageTexts.pt;

  const bookName = getBookNameFromSlug(bookSlug);
  if (!bookName) {
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('verses')
    .select('chapter')
    .eq('book', bookName)
    .eq('language_code', lang)
    .order('chapter', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Error fetching chapters for book:", bookName, error);
    notFound();
  }

  const totalChapters = data.chapter;
  const translatedBookName = getTranslatedBookName(bookName, lang);

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/bible`}>{texts.bible}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{translatedBookName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{translatedBookName}</h1>
        <p className="text-lg text-muted-foreground mt-2">{texts.title}</p>
      </div>

      <ChapterSelection
        totalChapters={totalChapters}
        bookSlug={bookSlug}
        lang={lang}
      />
    </main>
  );
}