import { Locale } from '@/lib/i18n/config';
import { PageForm } from '@/components/admin/pages/page-form';

interface NewPageProps {
  params: { lang: Locale };
}

export default function NewPage({ params }: NewPageProps) {
  const { lang } = params;
  return <PageForm lang={lang} />;
}