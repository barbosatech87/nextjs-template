"use client";

import { ChatInterface } from '@/components/ai/chat-interface';
import { Locale } from '@/lib/i18n/config';
import { useSession } from '@/components/auth/session-context-provider';
import { ChatLoginPrompt } from '@/components/ai/chat-login-prompt';
import { Loader2 } from 'lucide-react';
import { use } from 'react';

interface IaExplicaPageProps {
  params: { lang: Locale };
}

export default function IaExplicaPage({ params: paramsProp }: IaExplicaPageProps) {
  const params = use(paramsProp as any);
  const { user, isLoading } = useSession();

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (user) {
      return <ChatInterface lang={params.lang} />;
    }

    return <ChatLoginPrompt lang={params.lang} />;
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {texts.title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {texts.description}
        </p>
      </div>
      <div className="flex-grow min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}