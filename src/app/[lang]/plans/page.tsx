import { Locale } from "@/lib/i18n/config";
import { getUserActiveReadingPlans, getPublicReadingPlans } from "@/app/actions/plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivePlans } from "@/components/reading-plans/user-active-plans";
import { CreatePlanForm } from "@/components/reading-plans/create-plan-form";
import { PredefinedPlansList } from "@/components/reading-plans/predefined-plans-list";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { PlansLoginPrompt } from "@/components/reading-plans/plans-login-prompt";
import { Metadata } from "next";

interface PlansPageProps {
  params: Promise<{ lang: Locale }>;
}

export const dynamic = 'force-dynamic';

const pageTexts = {
    pt: { 
      title: "Planos de Leitura da Bíblia", 
      description: "Crie seu plano de leitura bíblica personalizado, acompanhe seu progresso ou explore planos prontos para começar sua jornada.",
      myPlans: "Meus Planos",
      createPlan: "Criar Plano",
      explorePlans: "Explorar Planos",
    },
    en: { 
      title: "Bible Reading Plans", 
      description: "Create your custom Bible reading plan, track your progress, or explore ready-made plans to start your journey.",
      myPlans: "My Plans",
      createPlan: "Create Plan",
      explorePlans: "Explore Plans",
    },
    es: { 
      title: "Planes de Lectura de la Biblia", 
      description: "Crea tu plan de lectura bíblica personalizado, sigue tu progreso o explora planes listos para comenzar tu viaje.",
      myPlans: "Mis Planes",
      createPlan: "Crear Plan",
      explorePlans: "Explorar Planes",
    },
};

export async function generateMetadata({ params }: PlansPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = pageTexts[lang] || pageTexts.pt;
  return {
    title: t.title,
    description: t.description,
  };
}

export default async function PlansPage({ params }: PlansPageProps) {
  const { lang } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = pageTexts[lang] || pageTexts.pt;

  if (!user) {
    return <PlansLoginPrompt lang={lang} />;
  }

  const [userPlans, publicPlans] = await Promise.all([
    getUserActiveReadingPlans(),
    getPublicReadingPlans()
  ]);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>

      <Tabs defaultValue="my-plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-plans">{t.myPlans}</TabsTrigger>
          <TabsTrigger value="create">{t.createPlan}</TabsTrigger>
          <TabsTrigger value="explore">{t.explorePlans}</TabsTrigger>
        </TabsList>
        <TabsContent value="my-plans" className="py-6">
          <UserActivePlans lang={lang} plans={userPlans} />
        </TabsContent>
        <TabsContent value="create" className="py-6">
          <CreatePlanForm lang={lang} />
        </TabsContent>
        <TabsContent value="explore" className="py-6">
          <PredefinedPlansList lang={lang} plans={publicPlans} />
        </TabsContent>
      </Tabs>
    </div>
  );
}