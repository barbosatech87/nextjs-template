import { Locale } from '@/lib/i18n/config';
import { MainLayout } from '@/components/layout/main-layout';
import { HeroSearch } from '@/components/home/hero-search';
import { DailyVerse } from '@/components/home/daily-verse';
import { PostSection } from '@/components/home/post-section';
import { getDailyVerse, getRecentPosts } from '@/app/actions/blog';

interface HomePageProps {
  params: { lang: Locale };
}

const homeTexts = {
  pt: {
    hero: { placeholder: 'Buscar na Bíblia...', button: 'Buscar' },
    dailyVerse: { title: 'Versículo do Dia', readChapter: 'Ler o capítulo', verseUnavailable: 'Versículo do dia indisponível no momento.' },
    postSection: { title: 'Últimas Postagens', viewAll: 'Ver todos' }
  },
  en: {
    hero: { placeholder: 'Search the Bible...', button: 'Search' },
    dailyVerse: { title: 'Verse of the Day', readChapter: 'Read chapter', verseUnavailable: 'Verse of the day is currently unavailable.' },
    postSection: { title: 'Latest Posts', viewAll: 'View all' }
  },
  es: {
    hero: { placeholder: 'Buscar en la Biblia...', button: 'Buscar' },
    dailyVerse: { title: 'Versículo del Día', readChapter: 'Leer el capítulo', verseUnavailable: 'El versículo del día no está disponible actualmente.' },
    postSection: { title: 'Últimas Publicaciones', viewAll: 'Ver todos' }
  }
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = params;
  const t = homeTexts[lang];

  // Busca de dados
  const dailyVerse = await getDailyVerse(lang);
  const recentPosts = await getRecentPosts({ lang, limit: 3, excludeCategorySlug: 'devocional' });

  return (
    <MainLayout lang={lang}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center gap-12 md:gap-16">
          <HeroSearch lang={lang} texts={t.hero} />
          <DailyVerse lang={lang} verse={dailyVerse} texts={t.dailyVerse} />
          <PostSection 
            lang={lang} 
            posts={recentPosts} 
            title={t.postSection.title} 
            viewAllLink={`/${lang}/blog`}
            viewAllText={t.postSection.viewAll}
          />
        </div>
      </div>
    </MainLayout>
  );
}