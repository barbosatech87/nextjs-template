import { Locale } from "@/lib/i18n/config";
import { getUserActiveReadingPlans } from "@/app/actions/plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivePlans } from "@/components/reading-plans/user-active-plans";
import { CreatePlanForm } from "@/components/reading-plans/create-plan-form";
import { PredefinedPlansList } from "@/components/reading-plans/predefined-plans-list";
import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { LoginPrompt } from "@/components/auth/login-prompt";

interface PlansPageProps {
  params: { lang: Locale };
}

const pageTexts = {
    pt: { 
      title: "Planos de Leitura", 
      description: "Gerencie seus planos, crie novos ou explore opções prontas.",
      myPlans: "Meus Planos",
      createPlan: "Criar Plano",
      explorePlans: "Explorar Planos",
      loginPromptTitle: "Recurso Exclusivo para Membros",
      loginPromptDescription: "Para criar e acompanhar seus planos de leitura, você precisa estar logado.",
    },
    en: { 
      title: "Reading Plans", 
      description: "Manage your plans, create new ones, or explore ready-made options.",
      myPlans: "My Plans",
      createPlan: "Create Plan",
      explorePlans: "Explore Plans",
      loginPromptTitle: "Exclusive Member Feature",
      loginPromptDescription: "To create and track your reading plans, you need to be logged in.",
    },
    es: { 
      title: "Planes de Lectura", 
      description: "Gestiona tus planes, crea nuevos o explora opciones listas.",
      myPlans: "Mis Planes",
      createPlan: "Crear Plan",
      explorePlans: "Explorar Planes",
      loginPromptTitle: "Función Exclusiva para Miembros",
      loginPromptDescription: "Para crear y seguir tus planes de lectura, necesitas iniciar sesión.",
    },
};

export default async function PlansPage({ params: { lang } }: PlansPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = pageTexts[lang] || pageTexts.pt;

  if (!user) {
    return (
      <LoginPrompt 
        lang={lang} 
        title={t.loginPromptTitle} 
        description={t.loginPromptDescription} 
      />
    );
  }

  const userPlans = await getUserActiveReadingPlans();

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
          <PredefinedPlansList lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}