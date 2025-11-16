import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getNotificationBroadcasts } from '@/app/actions/notifications';
import { NotificationsTable } from '@/components/admin/notifications/notifications-table';

interface ManageNotificationsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageNotificationsPage({ params }: ManageNotificationsPageProps) {
  const { lang } = await params;
  const broadcasts = await getNotificationBroadcasts();

  const t = {
    pt: {
      title: 'Gerenciar Notificações',
      description: 'Envie novas notificações e gerencie os envios existentes.',
      newNotification: 'Nova Notificação',
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
          <Link href={`/${lang}/admin/notifications/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.pt.newNotification}
          </Link>
        </Button>
      </div>
      <NotificationsTable broadcasts={broadcasts} lang={lang} />
    </div>
  );
}