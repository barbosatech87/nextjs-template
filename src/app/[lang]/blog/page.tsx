import { getPublishedPosts } from "@/app/actions/blog";
import PostCard from "@/components/blog/post-card";
import { PaginationControls } from "@/components/blog/pagination-controls";
import { Locale } from "@/lib/i18n/config";

const texts = {
  pt: {
    title: "Blog Bíblia & IA",
    noPosts: "Nenhuma postagem encontrada.",
  },
  en: {
    title: "Bible & AI Blog",
    noPosts: "No posts found.",
  },
  es: {
    title: "Blog Biblia & IA",
    noPosts: "No se encontraron entradas.",
  },
};

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const t = texts[lang] || texts.pt;

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