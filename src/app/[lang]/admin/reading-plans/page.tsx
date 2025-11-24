import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { getPredefinedPlans } from '@/app/actions/reading-plans';
import { PlansTable } from '@/components/admin/reading-plans/plans-table';
import { PlanFormDialog } from '@/components/admin/reading-plans/plan-form-dialog';

interface ManageReadingPlansPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ManageReadingPlansPage({ params }: ManageReadingPlansPageProps) {
  const { lang } = await params;
  const plans = await getPredefinedPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos de Leitura</h1>
          <p className="text-muted-foreground">
            Crie e gerencie os planos de leitura pré-definidos para os usuários.
          </p>
        </div>
        <PlanFormDialog lang={lang}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </PlanFormDialog>
      </div>
      <PlansTable plans={plans} lang={lang} />
    </div>
  );
}