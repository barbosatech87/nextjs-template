import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getSchedules } from '@/app/actions/schedules';
import { getAuthors } from '@/app/actions/users';
import { SchedulesTable } from '@/components/admin/schedules/schedules-table';
import { ScheduleFormDialog } from '@/components/admin/schedules/schedule-form-dialog';

interface ManageSchedulesPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageSchedulesPage({ params }: ManageSchedulesPageProps) {
  const { lang } = await params;
  const schedules = await getSchedules();
  const authors = await getAuthors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie a criação automática de conteúdo para o blog.
          </p>
        </div>
        <ScheduleFormDialog lang={lang} authors={authors}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </ScheduleFormDialog>
      </div>
      <SchedulesTable schedules={schedules} authors={authors} lang={lang} />
    </div>
  );
}