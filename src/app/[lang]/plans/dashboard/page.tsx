import { Locale } from "@/lib/i18n/config";
import { CreatePlanForm } from "@/components/reading-plans/create-plan-form";
import { UserActivePlans } from "@/components/reading-plans/user-active-plans";
import { getUserActiveReadingPlans } from "@/app/actions/plans";

interface PlansDashboardPageProps {
  params: { lang: Locale };
}

export default async function PlansDashboardPage({ params: { lang } }: PlansDashboardPageProps) {
  const userPlans = await getUserActiveReadingPlans();

  const t = {
    pt: { title: "Painel de Leitura", description: "Gerencie seus planos de leitura e acompanhe seu progresso." },
    en: { title: "Reading Dashboard", description: "Manage your reading plans and track your progress." },
    es: { title: "Panel de Lectura", description: "Gestiona tus planes de lectura y sigue tu progreso." },
  }[lang] || { title: "Painel de Leitura", description: "Gerencie seus planos de leitura e acompanhe seu progresso." };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UserActivePlans lang={lang} plans={userPlans} />
        </div>
        <div>
          <CreatePlanForm lang={lang} />
        </div>
      </div>
    </div>
  );
}