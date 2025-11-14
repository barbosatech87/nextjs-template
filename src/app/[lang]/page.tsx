import { Locale } from "@/lib/i18n/config";
import { HeroSearch } from "@/components/home/hero-search";
import { getDailyVerse, getRecentPosts } from "@/app/actions/blog";
import { DailyVerse } from "@/components/home/daily-verse";
import { PostSection } from "@/components/home/post-section";
import { Separator } from "@/components/ui/separator";

const homeTexts = {
  pt: {
    title: "Explore a Palavra",
    subtitle: "Busque versículos, capítulos e artigos. Encontre a inspiração que você precisa.",
    searchPlaceholder: "Digite um versículo, livro ou tópico...",
    searchButton: "Buscar",
    dailyVerseTitle: "Versículo do Dia",
    readChapter: "Ler o capítulo",
    verseUnavailable: "O versículo do dia não está disponível no momento. Por favor, tente novamente mais tarde.",
    devotionalTitle: "Devocional",
    blogTitle: "Artigos do Blog",
    viewAll: "Ver todos",
  },
  en: {
    title: "Explore the Word",
    subtitle: "Search for verses, chapters, and articles. Find the inspiration you need.",
    searchPlaceholder: "Enter a verse, book, or topic...",
    searchButton: "Search",
    dailyVerseTitle: "Verse of the Day",
    readChapter: "Read the chapter",
    verseUnavailable: "The verse of the day is currently unavailable. Please try again later.",
    devotionalTitle: "Devotional",
    blogTitle: "Blog Articles",
    viewAll: "View all",
  },
  es: {
    title: "Explora la Palabra",
    subtitle: "Busca versículos, capítulos y artículos. Encuentra a inspiração que necesitas.",
    searchPlaceholder: "Escribe un versículo, libro o tema...",
    searchButton: "Buscar",
    dailyVerseTitle: "Versículo del Día",
    readChapter: "Leer el capítulo",
    verseUnavailable: "El versículo del día no está disponible en este momento. Por favor, inténtalo de nuevo más tarde.",
    devotionalTitle: "Devocional",
    blogTitle: "Artículos del Blog",
    viewAll: "Ver todos",
  },
};

export default async function Home({ 
  params, 
  searchParams,
}: {
  params: { lang: Locale };
  searchParams: { [key: string]: string | string[] | undefined } | undefined;
}) {
  const { lang } = params;
  const texts = homeTexts[lang] || homeTexts.pt;
  
  const [dailyVerse, devotionalPosts, blogPosts] = await Promise.all([
    getDailyVerse(lang),
    getRecentPosts({ lang, limit: 3, includeCategorySlug: 'devocional' }),
    getRecentPosts({ lang, limit: 6, excludeCategorySlug: 'devocional' })
  ]);
  
  return (
    <div className="container px-4 md:px-8">
      <section className="flex flex-col items-center justify-center text-center py-20 md:py-24">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
          {texts.title}
        </h1>
        <p className="max-w-3xl text-lg md:text-xl text-muted-foreground mb-8">
          {texts.subtitle}
        </p>
        <HeroSearch 
          lang={lang} 
          texts={{
            placeholder: texts.searchPlaceholder,
            button: texts.searchButton,
          }}
        />
      </section>

      <section className="py-12 md:py-16">
        <DailyVerse 
          verse={dailyVerse} 
          lang={lang} 
          texts={{
            title: texts.dailyVerseTitle,
            readChapter: texts.readChapter,
            verseUnavailable: texts.verseUnavailable,
          }}
        />
      </section>

      <Separator />

      <PostSection
        title={texts.devotionalTitle}
        posts={devotionalPosts}
        lang={lang}
      />

      <Separator />

      <PostSection
        title={texts.blogTitle}
        posts={blogPosts}
        lang={lang}
        viewAllLink={`/${lang}/blog`}
        viewAllText={texts.viewAll}
      />
    </div>
  );
}