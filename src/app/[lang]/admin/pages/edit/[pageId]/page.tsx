import { Locale } from '@/lib/i18n/config';
import { getPageById } from '@/app/actions/pages';
import { PageForm } from '@/components/admin/pages/page-form';
import { notFound } from 'next/navigation';

interface EditPageProps {
  params: { lang: Locale; pageId: string };
}

export default async function EditPage({ params }: EditPageProps) {
  const { lang, pageId } = params;
  const page = await getPageById(pageId);

  if (!page) {
    notFound();
  }

  return <PageForm lang={lang} isEditing={true} initialData={page} pageId={pageId} />;
}