import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getAdminPages } from '@/app/actions/pages';
import { PagesTable } from '@/components/admin/pages/pages-table';

interface ManagePagesPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManagePagesPage({ params }: ManagePagesPageProps) {
  const { lang } = await params;
  const pages = await getAdminPages();

  const t = {
    pt: {
      title: 'Gerenciar Páginas',
      description: 'Crie e edite páginas públicas do seu site.',
      newPage: 'Nova Página',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.pt.title}</h1>
          <p className="text-muted-foreground">{t.pt.description}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/pages/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.pt.newPage}
          </Link>
        </Button>
      </div>
      <PagesTable pages={pages} lang={lang} />
    </div>
  );
}