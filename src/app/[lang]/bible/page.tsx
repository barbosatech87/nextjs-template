import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { Locale } from '@/lib/i18n/config';
import { BookSelection } from '@/components/bible/book-selection';
import { Metadata } from 'next';

const pageTexts = {
  pt: {
    title: "Bíblia Sagrada Online",
    description: "Leia e estude a Bíblia Sagrada. Escolha um livro do Antigo ou Novo Testamento para começar sua leitura e aprofundar seu conhecimento.",
    error: "Não foi possível carregar os livros. Tente novamente mais tarde."
  },
  en: {
    title: "Holy Bible Online",
    description: "Read and study the Holy Bible. Choose a book from the Old or New Testament to start your reading and deepen your knowledge.",
    error: "Could not load the books. Please try again later."
  },
  es: {
    title: "Santa Biblia en Línea",
    description: "Lee y estudia la Santa Biblia. Elige un libro del Antiguo o Nuevo Testamento para comenzar tu lectura y profundizar tu conocimiento.",
    error: "No se pudieron cargar los libros. Por favor, inténtalo de nuevo más tarde."
  }
}

interface BiblePageProps {
  params: { lang: Locale };
}

export async function generateMetadata({ params }: BiblePageProps): Promise<Metadata> {
  const { lang } = params;
  const t = pageTexts[lang] || pageTexts.pt;
  return {
    title: t.title,
    description: t.description,
  };
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { lang } = params;
  const supabase = await createSupabaseServerClient();
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