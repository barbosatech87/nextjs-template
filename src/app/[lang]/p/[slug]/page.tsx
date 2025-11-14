import { getPageBySlug } from "@/app/actions/pages";
import { notFound } from "next/navigation";
import { Locale } from "@/lib/i18n/config";
import { Separator } from "@/components/ui/separator";

interface PublicPageProps {
  params: { lang: Locale; slug: string };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { lang, slug } = params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container px-4 md:px-8 py-12">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
          {page.title}
        </h1>

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