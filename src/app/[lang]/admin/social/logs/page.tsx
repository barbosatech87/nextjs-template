import { Locale } from '@/lib/i18n/config';
import { getSocialAutomationLogs } from '@/app/actions/social';
import { SocialLogsTable } from '@/components/admin/social/social-logs-table';

interface SocialLogsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SocialLogsPage({ params }: SocialLogsPageProps) {
  const { lang } = await params;
  const logs = await getSocialAutomationLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Automação Social</h1>
        <p className="text-muted-foreground">
          Visualize o histórico de sucesso e falha das automações sociais.
        </p>
      </div>
      <SocialLogsTable logs={logs} />
    </div>
  );
}