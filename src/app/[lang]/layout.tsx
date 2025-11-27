import { ReactNode } from 'react';
import { Locale, i18n } from '@/lib/i18n/config';
import { LangSetter } from '@/components/i18n/lang-setter';
import { MainLayout } from '@/components/layout/main-layout';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

const pageTexts = {
  pt: {
    title: 'PaxWord - Explore a Palavra de Deus com Estudos e Devocionais',
    description: 'Um lugar para explorar a Bíblia, encontrar planos de leitura, devocionais e aprofundar sua fé com ferramentas de estudo e IA.',
  },
  en: {
    title: 'PaxWord - Explore God\'s Word with Studies and Devotionals',
    description: 'A place to explore the Bible, find reading plans, devotionals, and deepen your faith with study and AI tools.',
  },
  es: {
    title: 'PaxWord - Explora la Palabra de Dios con Estudios y Devocionales',
    description: 'Un lugar para explorar la Biblia, encontrar planes de lectura, devocionales y profundizar tu fe con herramientas de estudio e IA.',
  },
};

export async function generateMetadata({ params }: { params: { lang: Locale } }): Promise<Metadata> {
  const lang = params.lang || i18n.defaultLocale;
  const t = pageTexts[lang] || pageTexts.pt;

  return {
    title: {
      default: t.title,
      template: '%s | PaxWord',
    },
    description: t.description,
    openGraph: {
      title: {
        default: t.title,
        template: '%s | PaxWord',
      },
      description: t.description,
      siteName: 'PaxWord',
      locale: lang,
      type: 'website',
      images: [
        {
          url: '/social-share.png',
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: t.title,
        template: '%s | PaxWord',
      },
      description: t.description,
      images: ['/social-share.png'],
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!i18n.locales.includes(lang)) {
    notFound();
  }

  return (
    <>
      <LangSetter lang={lang} />
      <MainLayout lang={lang}>
        {children}
      </MainLayout>
    </>
  );
}