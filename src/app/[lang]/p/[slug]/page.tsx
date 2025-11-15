import { getPageBySlug } from "@/app/actions/pages";
import { notFound } from "next/navigation";
import { Locale } from "@/lib/i18n/config";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";

interface PublicPageProps {
  params: Promise<{ lang: Locale; slug: string }>;
}

// Função para gerar metadados dinâmicos
export async function generateMetadata(
  { params }: PublicPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { lang, slug } = await params;
  const page = await getPageBySlug(slug, lang);

  if (!page) {
    return {
      title: "Página não encontrada",
    };
  }

  return {
    title: page.title,
    description: page.summary,
    openGraph: {
      title: page.title,
      description: page.summary || '',
      url: `/${lang}/p/${slug}`,
      siteName: 'PaxWord',
      locale: lang,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: page.title,
      description: page.summary || '',
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { lang, slug } = await params;
  const page = await getPageBySlug(slug, lang);

  if (!page) {
    notFound();
  }

  return (
    <div className="container px-4 md:px-8 py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
          {page.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="uppercase">{page.language_code}</span>
          </Badge>
        </div>

        {page.summary && (
          <p className="text-xl italic text-foreground/80 mb-8 border-l-4 pl-4 border-primary/50">
            {page.summary}
          </p>
        )}

        <Separator className="mb-8" />

        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}