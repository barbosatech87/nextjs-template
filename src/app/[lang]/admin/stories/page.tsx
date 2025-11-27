import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, GalleryThumbnails, History } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getAdminStories, getStoryAutomationLogs } from '@/app/actions/stories';
import { StoriesTable } from '@/components/admin/stories/stories-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoryLogsTable } from '@/components/admin/stories/story-logs-table';

interface ManageStoriesPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageStoriesPage({ params }: ManageStoriesPageProps) {
  const { lang } = await params;
  const [stories, logs] = await Promise.all([
    getAdminStories(),
    getStoryAutomationLogs()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Web Stories</h1>
          <p className="text-muted-foreground">
            Crie e gerencie suas stories e automações.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/stories/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Story
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="stories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stories">
            <GalleryThumbnails className="mr-2 h-4 w-4" />
            Stories
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="mr-2 h-4 w-4" />
            Histórico de Automações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stories" className="mt-4">
          {/* @ts-ignore */}
          <StoriesTable stories={stories} lang={lang} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <StoryLogsTable logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}