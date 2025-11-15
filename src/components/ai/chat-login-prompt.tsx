"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Locale } from '@/lib/i18n/config';
import { Lightbulb, History, AlertTriangle } from 'lucide-react';

interface ChatLoginPromptProps {
  lang: Locale;
}

export function ChatLoginPrompt({ lang }: ChatLoginPromptProps) {
  const texts = {
    pt: {
      title: "Desbloqueie o Assistente de IA",
      description: "Faça login para ter acesso exclusivo à nossa ferramenta de estudo bíblico com Inteligência Artificial.",
      feature1Title: "Estudo Bíblico Interativo",
      feature1Desc: "Tire dúvidas, peça explicações de versículos e explore temas complexos da Bíblia.",
      feature2Title: "Contexto Histórico",
      feature2Desc: "Entenda o cenário cultural e histórico por trás das passagens bíblicas.",
      warningTitle: "Recurso em Desenvolvimento",
      warningDesc: "Nosso assistente de IA está em constante aprimoramento. Agradecemos sua paciência e feedback!",
      buttonText: "Fazer Login ou Cadastrar"
    },
    en: {
      title: "Unlock the AI Assistant",
      description: "Log in to get exclusive access to our AI-powered Bible study tool.",
      feature1Title: "Interactive Bible Study",
      feature1Desc: "Ask questions, get verse explanations, and explore complex biblical themes.",
      feature2Title: "Historical Context",
      feature2Desc: "Understand the cultural and historical background behind the biblical passages.",
      warningTitle: "Feature in Development",
      warningDesc: "Our AI assistant is constantly improving. We appreciate your patience and feedback!",
      buttonText: "Login or Sign Up"
    },
    es: {
      title: "Desbloquea el Asistente de IA",
      description: "Inicia sesión para obtener acceso exclusivo a nuestra herramienta de estudio bíblico con Inteligencia Artificial.",
      feature1Title: "Estudio Bíblico Interactivo",
      feature1Desc: "Resuelve dudas, pide explicaciones de versículos y explora temas bíblicos complejos.",
      feature2Title: "Contexto Histórico",
      feature2Desc: "Comprende el trasfondo cultural e histórico detrás de los pasajes bíblicos.",
      warningTitle: "Recurso en Desarrollo",
      warningDesc: "Nuestro asistente de IA está en constante mejora. ¡Agradecemos tu paciencia y tus comentarios!",
      buttonText: "Iniciar Sesión o Registrarse"
    }
  };

  const t = texts[lang] || texts.pt;

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">{t.title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">{t.feature1Title}</h3>
              <p className="text-sm text-muted-foreground">{t.feature1Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <History className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">{t.feature2Title}</h3>
              <p className="text-sm text-muted-foreground">{t.feature2Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">{t.warningTitle}</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">{t.warningDesc}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button asChild className="w-full">
            <Link href={`/${lang}/auth`}>{t.buttonText}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}