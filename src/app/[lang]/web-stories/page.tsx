import { getPaginatedPublishedStories } from "@/app/actions/stories";
import { PaginationControls } from "@/components/blog/pagination-controls";
import { StoryCard } from "@/components/stories/story-card";
import { Locale } from "@/lib/i18n/config";
import { Metadata } from "next";

const pageTexts = {
  pt: {
    title: "Web Stories",
    description: "Explore nossos conteúdos visuais e devocionais em formato de story.",
    noStories: "Nenhuma story encontrada.",
  },
  en: {
    title: "Web Stories",
    description: "Explore our visual content and devotionals in story format.",
    noStories: "No stories found.",
  },
  es: {
    title: "Web Stories",
    description: "Explora nuestro contenido visual y devocionales en formato de story.",
    noStories: "No se encontraron stories.",
  },
};

interface WebStoriesPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: WebStoriesPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = pageTexts[lang] || pageTexts.pt;
  return {
    title: t.title,
    description: t.description,
  };
}

export default async function WebStoriesPage({ params, searchParams }: WebStoriesPageProps) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = pageTexts[lang] || pageTexts.pt;

  const pageParam = sp?.page;
  const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const currentPage = parseInt(pageStr || '1', 10);

  const { stories, totalPages } = await getPaginatedPublishedStories(lang, currentPage, 9);

  return (
    <div className="container px-4 md:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold">{t.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t.description}</p>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>{t.noStories}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} lang={lang} />
            ))}
          </div>
          
          <PaginationControls 
            totalPages={totalPages} 
            currentPage={currentPage} 
            lang={lang} 
          />
        </>
      )}
    </div>
  );
}