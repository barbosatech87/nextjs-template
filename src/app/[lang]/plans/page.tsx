import { createSupabaseServerClient } from '@/integrations/supabase/server';
import { redirect } from 'next/navigation';
import { Locale } from '@/lib/i18n/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, BookOpen, Target, Users } from 'lucide-react';

interface PlansPageProps {
  params: { lang: Locale };
}

const texts = {
  pt: {
    title: "Planos de Leitura da Bíblia",
    description: "Mergulhe nas Escrituras de forma organizada e consistente. Crie seu próprio plano ou escolha um dos nossos.",
    loginButton: "Entrar ou Criar Conta",
    feature1: "Crie planos personalizados",
    feature2: "Escolha planos prontos",
    feature3: "Acompanhe seu progresso",
    feature4: "Compartilhe suas conquistas",
    join: "Junte-se a milhares de leitores e fortaleça sua jornada espiritual."
  },
  en: {
    title: "Bible Reading Plans",
    description: "Dive into the Scriptures in an organized and consistent way. Create your own plan or choose one of ours.",
    loginButton: "Login or Sign Up",
    feature1: "Create custom plans",
    feature2: "Choose pre-made plans",
    feature3: "Track your progress",
    feature4: "Share your achievements",
    join: "Join thousands of readers and strengthen your spiritual journey."
  },
  es: {
    title: "Planes de Lectura de la Biblia",
    description: "Sumérgete en las Escrituras de forma organizada y consistente. Crea tu propio plan o elige uno de los nuestros.",
    loginButton: "Iniciar Sesión o Registrarse",
    feature1: "Crea planes personalizados",
    feature2: "Elige planes listos",
    feature3: "Sigue tu progreso",
    feature4: "Comparte tus logros",
    join: "Únete a miles de lectores y fortalece tu viaje espiritual."
  }
};

export default async function PlansPage({ params: { lang } }: PlansPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(`/${lang}/plans/dashboard`);
  }

  const t = texts[lang] || texts.pt;

  const features = [
    { text: t.feature1, icon: <Target className="h-5 w-5 text-primary" /> },
    { text: t.feature2, icon: <BookOpen className="h-5 w-5 text-primary" /> },
    { text: t.feature3, icon: <CheckCircle className="h-5 w-5 text-primary" /> },
    { text: t.feature4, icon: <Users className="h-5 w-5 text-primary" /> },
  ];

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 text-center">
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</CardTitle>
          <CardDescription className="mt-4 text-lg text-muted-foreground">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                {feature.icon}
                <p className="font-medium">{feature.text}</p>
              </div>
            ))}
          </div>
          <p className="mb-6 text-muted-foreground">{t.join}</p>
          <Link href={`/${lang}/auth`}>
            <Button size="lg">{t.loginButton}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}