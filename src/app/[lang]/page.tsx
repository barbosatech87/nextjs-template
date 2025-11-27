import { Locale } from '@/lib/i18n/config';
import { HeroSearch } from '@/components/home/hero-search';
import { DailyVerse } from '@/components/home/daily-verse';
import { PostSection } from '@/components/home/post-section';
import { getDailyVerse, getRecentPosts } from '@/app/actions/blog';
import { ReadBibleCta } from '@/components/home/read-bible-cta';
import { Metadata } from 'next';

interface HomePageProps {
  params: Promise<{ lang: Locale }>;
}

const pageTexts = {
  pt: {
    title: 'PaxWord - Explore a Palavra de Deus com Estudos e Devocionais',
    description: 'Explore a Bíblia Sagrada, encontre planos de leitura, devocionais diários e aprofunde sua fé com ferramentas de estudo e IA.',
    hero: { heading: 'Explore a palavra', placeholder: 'Buscar na Bíblia...', button: 'Buscar' },
    dailyVerse: { title: 'Versículo do Dia', readChapter: 'Ler o capítulo', verseUnavailable: 'Versículo do dia indisponível no momento.' },
    readBible: {
      title: "Leia a Bíblia",
      description: "Mergulhe nas Escrituras. Explore todos os livros do Antigo e Novo Testamento em um só lugar.",
      button: "Acessar a Bíblia Completa"
    },
    postSection: { 
      latest: { title: 'Últimas Postagens', viewAll: 'Ver todos' },
      devotional: { title: 'Devocional', viewAll: 'Ver todos devocionais' }
    }
  },
  en: {
    title: 'PaxWord - Explore God\'s Word with Studies and Devotionals',
    description: 'Explore the Holy Bible, find reading plans, daily devotionals, and deepen your faith with study and AI tools.',
    hero: { heading: 'Explore the Word', placeholder: 'Search the Bible...', button: 'Search' },
    dailyVerse: { title: 'Verse of the Day', readChapter: 'Read chapter', verseUnavailable: 'Verse of the day is currently unavailable.' },
    readBible: {
      title: "Read the Bible",
      description: "Dive into the Scriptures. Explore all the books of the Old and New Testaments in one place.",
      button: "Access the Full Bible"
    },
    postSection: { 
      latest: { title: 'Latest Posts', viewAll: 'View all' },
      devotional: { title: 'Devotional', viewAll: 'View all devotionals' }
    }
  },
  es: {
    title: 'PaxWord - Explora la Palabra de Dios con Estudios y Devocionales',
    description: 'Explora la Santa Biblia, encuentra planes de lectura, devocionales diarios y profundiza tu fe con herramientas de estudio e IA.',
    hero: { heading: 'Explora la Palabra', placeholder: 'Buscar en la Biblia...', button: 'Buscar' },
    dailyVerse: { title: 'Versículo del Día', readChapter: 'Leer el capítulo', verseUnavailable: 'El versículo del día no está disponible actualmente.' },
    readBible: {
      title: "Leer la Biblia",
      description: "Sumérgete en las Escrituras. Explora todos los libros del Antiguo y Nuevo Testamento en un solo lugar.",
      button: "Acceder a la Biblia Completa"
    },
    postSection: { 
      latest: { title: 'Últimas Publicaciones', viewAll: 'Ver todos' },
      devotional: { title: 'Devocional', viewAll: 'Ver todos los devocionales' }
    }
  }
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = pageTexts[lang] || pageTexts.pt;

  return {
    title: t.title,
    description: t.description,
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  const t = pageTexts[lang] || pageTexts.pt;

  const [dailyVerseResult, devotionalPostsResult, recentPostsResult] = await Promise.allSettled([
    getDailyVerse(lang),
    getRecentPosts({ lang, limit: 3, includeCategorySlug: 'devocional' }),
    getRecentPosts({ lang, limit: 6, excludeCategorySlug: 'devocional' })
  ]);

  const dailyVerse = dailyVerseResult.status === 'fulfilled' ? dailyVerseResult.value : null;
  const devotionalPosts = devotionalPostsResult.status === 'fulfilled' ? devotionalPostsResult.value : [];
  const recentPosts = recentPostsResult.status === 'fulfilled' ? recentPostsResult.value : [];

  if (dailyVerseResult.status === 'rejected') {
    console.error("Failed to fetch daily verse:", dailyVerseResult.reason);
  }
  if (devotionalPostsResult.status === 'rejected') {
    console.error("Failed to fetch devotional posts:", devotionalPostsResult.reason);
  }
  if (recentPostsResult.status === 'rejected') {
    console.error("Failed to fetch recent posts:", recentPostsResult.reason);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center gap-12 md:gap-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t.hero.heading}
        </h1>
        <HeroSearch lang={lang} texts={t.hero} />
        <DailyVerse lang={lang} verse={dailyVerse} texts={t.dailyVerse} />
      </div>

      <ReadBibleCta lang={lang} texts={t.readBible} />

      <div>
        <PostSection 
          lang={lang} 
          posts={devotionalPosts} 
          title={t.postSection.devotional.title} 
          viewAllLink={`/${lang}/blog/category/devocional`}
          viewAllText={t.postSection.devotional.viewAll}
        />
        <PostSection 
          lang={lang} 
          posts={recentPosts} 
          title={t.postSection.latest.title} 
          viewAllLink={`/${lang}/blog`}
          viewAllText={t.postSection.latest.viewAll}
        />
      </div>
    </div>
  );
}