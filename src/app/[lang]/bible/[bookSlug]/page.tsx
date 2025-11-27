import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
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
import { Metadata } from 'next';

const pageTexts = {
  pt: {
    bible: "Bíblia",
    title: "Escolha o Capítulo",
    description: "Selecione um capítulo do livro de {bookName} para iniciar sua leitura da Bíblia Sagrada.",
    error: "Livro não encontrado."
  },
  en: {
    bible: "Bible",
    title: "Choose a Chapter",
    description: "Select a chapter from the book of {bookName} to begin your reading of the Holy Bible.",
    error: "Book not found."
  },
  es: {
    bible: "Biblia",
    title: "Elige el Capítulo",
    description: "Selecciona un capítulo del libro de {bookName} para comenzar tu lectura de la Santa Biblia.",
    error: "Libro no encontrado."
  }
};

interface BookPageProps {
  params: Promise<{ lang: Locale; bookSlug: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { lang, bookSlug } = await params;
  const t = pageTexts[lang] || pageTexts.pt;
  const bookName = getBookNameFromSlug(bookSlug);

  if (!bookName) {
    return { title: t.error };
  }

  const translatedBookName = getTranslatedBookName(bookName, lang);
  return {
    title: `${translatedBookName} - ${t.title}`,
    description: t.description.replace('{bookName}', translatedBookName),
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { lang, bookSlug } = await params;
  const texts = pageTexts[lang] || pageTexts.pt;

  const bookName = getBookNameFromSlug(bookSlug);
  if (!bookName) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
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