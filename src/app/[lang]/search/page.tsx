import { Suspense } from 'react';
import { Locale } from '@/lib/i18n/config';
import { searchAll, SearchResult } from '@/app/actions/search';
import Link from 'next/link';
import { BookOpen, Newspaper, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const searchPageTexts = {
  pt: {
    title: "Resultados da Busca por",
    noResults: "Nenhum resultado encontrado.",
    loading: "Buscando...",
  },
  en: {
    title: "Search Results for",
    noResults: "No results found.",
    loading: "Searching...",
  },
  es: {
    title: "Resultados de Búsqueda para",
    noResults: "No se encontraron resultados.",
    loading: "Buscando...",
  },
};

const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
  switch (type) {
    case 'verse':
      return <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />;
    case 'blog':
      return <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />;
    case 'book':
        return <Book className="h-5 w-5 text-primary flex-shrink-0" />;
    default:
      return null;
  }
};

async function SearchResults({ query, lang }: { query: string; lang: Locale }) {
  const results = await searchAll(query, lang);
  const texts = searchPageTexts[lang] || searchPageTexts.pt;

  if (results.length === 0) {
    return <p className="text-center text-muted-foreground">{texts.noResults}</p>;
  }

  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <Link href={result.url} key={index} className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <ResultIcon type={result.type} />
                <CardTitle className="text-lg text-primary hover:underline">
                  {result.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p 
                className="text-sm text-muted-foreground line-clamp-3"
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function SearchSkeleton({ lang }: { lang: Locale }) {
    const texts = searchPageTexts[lang] || searchPageTexts.pt;
    return (
        <div className="space-y-6">
            <p>{texts.loading}</p>
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function SearchPage({
  params,
  searchParams,
}: {
  params: { lang: Locale };
  searchParams?: { q?: string };
}) {
  const { lang } = params;
  const query = searchParams?.q || '';
  const texts = searchPageTexts[lang] || searchPageTexts.pt;

  return (
    <div className="container px-4 md:px-8 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        {texts.title} <span className="text-primary">&quot;{query}&quot;</span>
      </h1>
      <Suspense fallback={<SearchSkeleton lang={lang} />}>
        <SearchResults query={query} lang={lang} />
      </Suspense>
    </div>
  );
}