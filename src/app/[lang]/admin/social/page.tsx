import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getSocialAutomations } from '@/app/actions/social';
import { AutomationsTable } from '@/components/admin/social/automations-table';
import { AutomationFormDialog } from '@/components/admin/social/automation-form-dialog';

interface ManageSocialPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageSocialPage({ params }: ManageSocialPageProps) {
  const { lang } = await params;
  const automations = await getSocialAutomations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automação Social</h1>
          <p className="text-muted-foreground">
            Gerencie postagens automáticas para suas redes sociais.
          </p>
        </div>
        <AutomationFormDialog lang={lang}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Automação
          </Button>
        </AutomationFormDialog>
      </div>
      <AutomationsTable automations={automations} lang={lang} />
    </div>
  );
}