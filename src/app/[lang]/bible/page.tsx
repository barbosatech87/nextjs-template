import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { Locale } from '@/lib/i18n/config';
import { BookSelection } from '@/components/bible/book-selection';

const pageTexts = {
  pt: {
    title: "Ler a Bíblia",
    description: "Escolha um livro para começar a sua leitura.",
    error: "Não foi possível carregar os livros. Tente novamente mais tarde."
  },
  en: {
    title: "Read the Bible",
    description: "Choose a book to start your reading.",
    error: "Could not load the books. Please try again later."
  },
  es: {
    title: "Leer la Biblia",
    description: "Elige un libro para comenzar tu lectura.",
    error: "No se pudieron cargar los libros. Por favor, inténtalo de nuevo más tarde."
  }
}

interface BiblePageProps {
  params: { lang: Locale };
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { lang } = params;
  const supabase = createSupabaseServerClient();
  const texts = pageTexts[lang] || pageTexts.pt;

  const { data: books, error } = await supabase.rpc('get_bible_metadata', {
    lang_code: lang,
  });

  if (error || !books) {
    console.error("Error fetching bible metadata:", error);
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">{texts.error}</h1>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{texts.description}</p>
      </div>
      <BookSelection books={books} lang={lang} />
    </main>
  );
}