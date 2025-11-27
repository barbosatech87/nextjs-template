import { Locale } from '@/lib/i18n/config';
import { StoryEditor } from '@/components/admin/stories/story-editor';

interface NewStoryPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function NewStoryPage({ params }: NewStoryPageProps) {
  const { lang } = await params;
  return (
    <div className="space-y-6 h-full">
      <div>
        <h1 className="text-2xl font-bold">Nova Web Story</h1>
        <p className="text-muted-foreground">
          Crie stories visuais para engajar seu público.
        </p>
      </div>
      <StoryEditor lang={lang} />
    </div>
  );
}