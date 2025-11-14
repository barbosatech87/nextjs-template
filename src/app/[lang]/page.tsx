import { Locale } from '@/lib/i18n/config';
import { MainLayout } from '@/components/layout/main-layout';
import { HeroSearch } from '@/components/home/hero-search';
import { DailyVerse } from '@/components/home/daily-verse';
import { PostSection } from '@/components/home/post-section';

interface HomePageProps {
  params: { lang: Locale };
}

export default function HomePage({ params }: HomePageProps) {
  const { lang } = params;

  return (
    <MainLayout lang={lang}>
      <HeroSearch lang={lang} />
      <DailyVerse lang={lang} />
      <PostSection lang={lang} />
    </MainLayout>
  );
}