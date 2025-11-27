import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getAdminStories } from '@/app/actions/stories';
import { StoriesTable } from '@/components/admin/stories/stories-table';

interface ManageStoriesPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageStoriesPage({ params }: ManageStoriesPageProps) {
  const { lang } = await params;
  const stories = await getAdminStories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Web Stories</h1>
          <p className="text-muted-foreground">
            Crie experiências visuais imersivas para o Google Discover.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/stories/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Story
          </Link>
        </Button>
      </div>
      {/* @ts-ignore */}
      <StoriesTable stories={stories} lang={lang} />
    </div>
  );
}