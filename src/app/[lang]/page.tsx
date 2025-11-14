import { Locale } from '@/lib/i18n/config';
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
    postSection: { 
      latest: { title: 'Últimas Postagens', viewAll: 'Ver todos' },
      devotional: { title: 'Devocional', viewAll: 'Ver todos devocionais' }
    }
  },
  en: {
    hero: { placeholder: 'Search the Bible...', button: 'Search' },
    dailyVerse: { title: 'Verse of the Day', readChapter: 'Read chapter', verseUnavailable: 'Verse of the day is currently unavailable.' },
    postSection: { 
      latest: { title: 'Latest Posts', viewAll: 'View all' },
      devotional: { title: 'Devotional', viewAll: 'View all devotionals' }
    }
  },
  es: {
    hero: { placeholder: 'Buscar en la Biblia...', button: 'Buscar' },
    dailyVerse: { title: 'Versículo del Día', readChapter: 'Leer el capítulo', verseUnavailable: 'El versículo del día no está disponible actualmente.' },
    postSection: { 
      latest: { title: 'Últimas Publicaciones', viewAll: 'Ver todos' },
      devotional: { title: 'Devotional', viewAll: 'Ver todos los devocionales' }
    }
  }
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = params;
  const t = homeTexts[lang];

  // Busca de dados
  const dailyVerse = await getDailyVerse(lang);
  
  // Posts Devocionais (3 mais recentes da categoria 'devocional')
  const devotionalPosts = await getRecentPosts({ lang, limit: 3, includeCategorySlug: 'devocional' });

  // Outros Posts Recentes (6 mais recentes, excluindo 'devocional')
  const recentPosts = await getRecentPosts({ lang, limit: 6, excludeCategorySlug: 'devocional' });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center gap-12 md:gap-16">
        <HeroSearch lang={lang} texts={t.hero} />
        <DailyVerse lang={lang} verse={dailyVerse} texts={t.dailyVerse} />
      </div>

      <div className="mt-12 md:mt-16">
        {/* Seção Devocional */}
        <PostSection 
          lang={lang} 
          posts={devotionalPosts} 
          title={t.postSection.devotional.title} 
          viewAllLink={`/${lang}/blog?category=devocional`}
          viewAllText={t.postSection.devotional.viewAll}
        />

        {/* Seção Últimas Postagens */}
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