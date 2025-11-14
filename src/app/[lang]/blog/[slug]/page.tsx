import { getPostBySlug } from "@/app/actions/blog";
import { notFound } from "next/navigation";
import { Calendar, User, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Locale } from "@/lib/i18n/config";

const texts = {
  pt: {
    author: "Por",
    published: "Publicado em",
    language: "Idioma",
    notFound: "Postagem não encontrada.",
  },
  en: {
    author: "By",
    published: "Published on",
    language: "Language",
    notFound: "Post not found.",
  },
  es: {
    author: "Por",
    published: "Publicado el",
    language: "Idioma",
    notFound: "Entrada no encontrada.",
  },
};

interface BlogPostPageProps {
  params: { lang: Locale; slug: string }; // Corrigido
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = params;
  const t = texts[lang] || texts.pt;

  if (Array.isArray(slug) || !slug) {
    notFound();
  }

  const post = await getPostBySlug(slug, lang);

  if (!post) {
    notFound();
  }

  const authorName = post.author_first_name || post.author_last_name 
    ? `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
    : 'Autor Desconhecido';

  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="container px-4 md:px-8 py-12">
      <article className="max-w-3xl mx-auto">
        {post.image_url && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{t.author} {authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{t.published} {formattedDate}</span>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span className="uppercase">{post.language_code}</span>
          </Badge>
        </div>

        {post.summary && (
          <p className="text-xl italic text-foreground/80 mb-8 border-l-4 pl-4 border-primary/50">
            {post.summary}
          </p>
        )}

        <Separator className="mb-8" />

        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}