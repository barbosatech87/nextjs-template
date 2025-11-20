import { Locale } from '@/lib/i18n/config';
import { getSocialAutomationLogs } from '@/app/actions/social';
import { SocialLogsTable } from '@/components/admin/social/social-logs-table';
import { ClearLogsButton } from '@/components/admin/social/clear-logs-button';

interface SocialLogsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SocialLogsPage({ params }: SocialLogsPageProps) {
  const { lang } = await params;
  const logs = await getSocialAutomationLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Automação Social</h1>
          <p className="text-muted-foreground">
            Visualize o histórico de sucesso e falha das automações sociais.
          </p>
        </div>
        <ClearLogsButton lang={lang} />
      </div>
      <SocialLogsTable logs={logs} />
    </div>
  );
}