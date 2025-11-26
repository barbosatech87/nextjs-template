import { Locale } from '@/lib/i18n/config';
import IaExplicaClient from './ia-explica-client';
import { Metadata } from 'next';

interface IaExplicaPageProps {
  params: { lang: Locale };
}

const pageTexts = {
  pt: {
    title: "IA Explica - Tire Dúvidas da Bíblia com Inteligência Artificial",
    description: "Use nosso assistente de IA para fazer perguntas sobre a Bíblia, entender versículos complexos, explorar temas teológicos e obter contexto histórico."
  },
  en: {
    title: "AI Explains - Ask Bible Questions with Artificial Intelligence",
    description: "Use our AI assistant to ask questions about the Bible, understand complex verses, explore theological themes, and get historical context."
  },
  es: {
    title: "IA Explica - Resuelve Dudas de la Biblia con Inteligencia Artificial",
    description: "Usa nuestro asistente de IA para hacer preguntas sobre la Biblia, entender versículos complejos, explorar temas teológicos y obtener contexto histórico."
  }
};

export async function generateMetadata({ params }: IaExplicaPageProps): Promise<Metadata> {
  const { lang } = params;
  const t = pageTexts[lang] || pageTexts.pt;
  return {
    title: t.title,
    description: t.description,
  };
}

export default function IaExplicaPage({ params }: IaExplicaPageProps) {
  return <IaExplicaClient params={params} />;
}