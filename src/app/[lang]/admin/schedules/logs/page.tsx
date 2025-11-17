import { Locale } from '@/lib/i18n/config';
import { getAutomationLogs } from '@/app/actions/schedules';
import { LogsTable } from '@/components/admin/schedules/logs-table';

interface LogsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function LogsPage({ params }: LogsPageProps) {
  const { lang } = await params;
  const logs = await getAutomationLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Execuções</h1>
        <p className="text-muted-foreground">
          Visualize o histórico de sucesso e falha das automações.
        </p>
      </div>
      <LogsTable logs={logs} />
    </div>
  );
}