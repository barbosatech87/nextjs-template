import { Locale } from '@/lib/i18n/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookMarked, PlusCircle, Compass } from 'lucide-react';
import { UserActivePlans } from '@/components/reading-plans/user-active-plans';
import { CreatePlanForm } from '@/components/reading-plans/create-plan-form';
import { PredefinedPlansList } from '@/components/reading-plans/predefined-plans-list';

interface PlansDashboardPageProps {
  params: { lang: Locale };
}

const pageTexts = {
  pt: {
    title: 'Meus Planos de Leitura',
    tabMyPlans: 'Meus Planos',
    tabCreate: 'Criar Plano',
    tabExplore: 'Explorar Planos',
  },
  en: {
    title: 'My Reading Plans',
    tabMyPlans: 'My Plans',
    tabCreate: 'Create Plan',
    tabExplore: 'Explore Plans',
  },
  es: {
    title: 'Mis Planes de Lectura',
    tabMyPlans: 'Mis Planes',
    tabCreate: 'Crear Plan',
    tabExplore: 'Explorar Planes',
  },
};

export default function PlansDashboardPage({ params }: PlansDashboardPageProps) {
  const { lang } = params;
  const t = pageTexts[lang] || pageTexts.pt;

  return (
    <div className="container mx-auto max-w-5xl py-12">
      <h1 className="text-3xl font-bold mb-8">{t.title}</h1>
      
      <Tabs defaultValue="my-plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="my-plans" className="flex items-center gap-2 py-2">
            <BookMarked className="h-4 w-4" />
            {t.tabMyPlans}
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2 py-2">
            <PlusCircle className="h-4 w-4" />
            {t.tabCreate}
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex items-center gap-2 py-2">
            <Compass className="h-4 w-4" />
            {t.tabExplore}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-plans" className="mt-6">
          <UserActivePlans lang={lang} />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <CreatePlanForm lang={lang} />
        </TabsContent>
        
        <TabsContent value="explore" className="mt-6">
          <PredefinedPlansList lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}