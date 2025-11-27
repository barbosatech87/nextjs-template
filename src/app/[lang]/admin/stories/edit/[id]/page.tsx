import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { StoryEditor } from '@/components/admin/stories/story-editor';
import { getStoryById } from '@/app/actions/stories';

interface EditStoryPageProps {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function EditStoryPage({ params }: EditStoryPageProps) {
  const { lang, id } = await params;
  const story = await getStoryById(id);

  if (!story) {
    notFound();
  }

  return (
    <div className="space-y-6 h-full">
      <div>
        <h1 className="text-2xl font-bold">Editar Web Story</h1>
        <p className="text-muted-foreground">
          Atualize o conteúdo da sua story.
        </p>
      </div>
      <StoryEditor lang={lang} initialData={story} />
    </div>
  );
}