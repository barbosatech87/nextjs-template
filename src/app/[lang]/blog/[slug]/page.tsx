import { getPostBySlug, getRelatedPosts } from "@/app/actions/blog";
import { notFound } from "next/navigation";
import { Calendar, User, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Locale } from "@/lib/i18n/config";
import { PostSection } from "@/components/home/post-section";
import { Metadata, ResolvingMetadata } from "next";
import { ShareButtons } from "@/components/social/share-buttons";
import Link from "next/link";
import Image from "next/image";

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
  params: Promise<{ lang: Locale; slug: string }>;
}

// Função para gerar metadados dinâmicos
export async function generateMetadata(
  { params }: BlogPostPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug, lang);

  if (!post) {
    return {
      title: "Post não encontrado",
    };
  }

  const authorName = post.author_first_name || post.author_last_name 
    ? `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
    : 'PaxWord';

  const imageUrl = post.image_url || '/social-share.png';
  const imageAlt = post.image_alt_text || post.title;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary || '',
      url: `/${lang}/blog/${slug}`,
      siteName: 'PaxWord',
      images: [
        {
          url: imageUrl,
          alt: imageAlt,
        },
      ],
      locale: lang,
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary || '',
      images: {
        url: imageUrl,
        alt: imageAlt,
      },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { lang, slug } = await params;
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
    categoryIds: post.categories.map(c => c.id),
    authorId: post.author_id,
    lang,
  });

  const authorName = post.author_first_name || post.author_last_name 
    ? `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim()
    : 'Autor Desconhecido';

  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

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
    },
    'datePublished': post.published_at,
    'dateModified': post.updated_at || post.published_at,
    'articleSection': post.categories.map(c => c.name).join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container px-4 md:px-8 py-12">
        <article className="max-w-3xl mx-auto">
          {post.image_url && (
            <div className="mb-8 relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-xl">
              <Image 
                src={post.image_url} 
                alt={post.image_alt_text || post.title} 
                fill
                priority
                quality={75}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
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

          {post.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {post.categories.map(category => (
                <Link key={category.slug} href={`/${lang}/blog/category/${category.slug}`}>
                  <Badge variant="outline" className="hover:bg-accent transition-colors">
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <ShareButtons 
            title={post.title}
            summary={post.summary}
            path={`blog/${post.slug}`}
            lang={lang}
            className="mb-8"
          />

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

          <Separator className="my-8" />

          <ShareButtons 
            title={post.title}
            summary={post.summary}
            path={`blog/${post.slug}`}
            lang={lang}
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