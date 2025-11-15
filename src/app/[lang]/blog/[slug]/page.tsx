import { getPostBySlug, getRelatedPosts } from "@/app/actions/blog";
import { notFound } from "next/navigation";
import { Calendar, User, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Locale } from "@/lib/i18n/config";
import { PostSection } from "@/components/home/post-section";
import { Metadata, ResolvingMetadata } from "next";

const texts = {
  pt: {
    author: "Por",
    published: "Publicado em",
    language: "Idioma",
    notFound: "Postagem não encontrada.",
    relatedPosts: "Artigos Relacionados",
  },
  en: {
    author: "By",
    published: "Published on",
    language: "Language",
    notFound: "Post not found.",
    relatedPosts: "Related Articles",
  },
  es: {
    author: "Por",
    published: "Publicado el",
    language: "Idioma",
    notFound: "Entrada no encontrada.",
    relatedPosts: "Artículos Relacionados",
  },
};

interface BlogPostPageProps {
  params: { lang: Locale; slug: string };
}

// Função para gerar metadados dinâmicos
export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { lang, slug } = params;
  const post = await getPostBySlug(slug, lang);

  if (!post) {
    return {
      title: "Post não encontrado",
    };
  }

  const authorName = post.author_first_name || post.author_last_name 
    ? `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
    : 'PaxWord';

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary || '',
      url: `/${lang}/blog/${slug}`,
      siteName: 'PaxWord',
      images: post.image_url ? [
        {
          url: post.image_url,
          width: 1200,
          height: 630,
          alt: post.image_alt_text || post.title,
        },
      ] : [],
      locale: lang,
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary || '',
      images: post.image_url ? [post.image_url] : [],
    },
  };
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

  const relatedPosts = await getRelatedPosts({
    postId: post.id,
    categoryIds: post.category_ids,
    authorId: post.author_id,
    lang,
  });

  const authorName = post.author_first_name || post.author_last_name 
    ? `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
    : 'Autor Desconhecido';

  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // Construção do objeto JSON-LD para Schema.org
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.paxword.com/${lang}/blog/${slug}`,
    },
    'headline': post.title,
    'description': post.summary,
    'image': post.image_url ? [post.image_url] : [],
    'author': {
      '@type': 'Person',
      'name': authorName,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'PaxWord',
      // 'logo': {
      //   '@type': 'ImageObject',
      //   'url': 'https://www.paxword.com/logo.png' // URL do logo
      // }
    },
    'datePublished': post.published_at,
    'dateModified': post.updated_at || post.published_at,
  };

  return (
    <>
      {/* Script de Dados Estruturados (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container px-4 md:px-8 py-12">
        <article className="max-w-3xl mx-auto">
          {post.image_url && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
              <img 
                src={post.image_url} 
                alt={post.image_alt_text || post.title} 
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

        {relatedPosts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16">
            <Separator />
            <div className="pt-12">
              <PostSection
                title={t.relatedPosts}
                posts={relatedPosts}
                lang={lang}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}