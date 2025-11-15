import { Locale } from '@/lib/i18n/config';
import { PageForm } from '@/components/admin/pages/page-form';

interface NewPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function NewPage({ params }: NewPageProps) {
  const { lang } = await params;
  return <PageForm lang={lang} />;
}