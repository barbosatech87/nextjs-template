import { getPublishedPosts } from "@/app/actions/blog";
import PostCard from "@/components/blog/post-card";
import { PaginationControls } from "@/components/blog/pagination-controls";
import { Locale } from "@/lib/i18n/config";
import { Metadata } from "next";

const pageTexts = {
  pt: {
    title: "Blog - Artigos e Devocionais Cristãos",
    description: "Leia nossos últimos artigos, estudos bíblicos e devocionais para fortalecer sua fé e aprofundar seu conhecimento da Palavra.",
    noPosts: "Nenhuma postagem encontrada.",
  },
  en: {
    title: "Blog - Christian Articles and Devotionals",
    description: "Read our latest articles, Bible studies, and devotionals to strengthen your faith and deepen your knowledge of the Word.",
    noPosts: "No posts found.",
  },
  es: {
    title: "Blog - Artículos y Devocionales Cristianos",
    description: "Lee nuestros últimos artículos, estudios bíblicos y devocionales para fortalecer tu fe y profundizar tu conocimiento de la Palabra.",
    noPosts: "No se encontraron entradas.",
  },
};

interface BlogListPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: BlogListPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = pageTexts[lang] || pageTexts.pt;
  return {
    title: t.title,
    description: t.description,
  };
}

export default async function BlogListPage({
  params,
  searchParams,
}: BlogListPageProps) {
  const { lang } = await params;
  const sp = await searchParams;
  const t = pageTexts[lang] || pageTexts.pt;

  const pageParam = sp?.page;
  const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const currentPage = parseInt(pageStr || '1', 10);

  const { posts, totalPages } = await getPublishedPosts(lang, currentPage);

  return (
    <div className="container px-4 md:px-8 py-12">
      <h1 className="text-4xl font-extrabold mb-10 text-center">{t.title}</h1>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>{t.noPosts}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} lang={lang} />
            ))}
          </div>
          
          <PaginationControls 
            totalPages={totalPages} 
            currentPage={currentPage} 
            lang={lang} 
          />
        </>
      )}
    </div>
  );
}