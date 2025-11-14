"use client";

import { use } from 'react';
import { ChatInterface } from '@/components/ai/chat-interface';
import { Locale } from '@/lib/i18n/config';

interface IaExplicaPageProps {
  params: { lang: Locale };
}

export default function IaExplicaPage({ params: paramsProp }: IaExplicaPageProps) {
  const params = use(paramsProp);

  const pageTexts = {
    pt: {
      title: "IA Explica",
      description: "Tire suas dúvidas sobre a Bíblia com nosso assistente de IA."
    },
    en: {
      title: "AI Explains",
      description: "Ask questions about the Bible with our AI assistant."
    },
    es: {
      title: "IA Explica",
      description: "Resuelve tus dudas sobre la Biblia con nuestro asistente de IA."
    }
  };

  const texts = pageTexts[params.lang] || pageTexts.pt;

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {texts.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {texts.description}
        </p>
      </div>
      <ChatInterface lang={params.lang} />
    </div>
  );
}