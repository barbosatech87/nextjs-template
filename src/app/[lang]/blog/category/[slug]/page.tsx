import { getPublishedPostsByCategory } from "@/app/actions/blog";
import PostCard from "@/components/blog/post-card";
import { PaginationControls } from "@/components/blog/pagination-controls";
import { Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

const texts = {
  pt: {
    title: "Posts na categoria:",
    noPosts: "Nenhuma postagem encontrada nesta categoria.",
    blog: "Blog",
    categories: "Categorias",
  },
  en: {
    title: "Posts in category:",
    noPosts: "No posts found in this category.",
    blog: "Blog",
    categories: "Categories",
  },
  es: {
    title: "Entradas en la categoría:",
    noPosts: "No se encontraron entradas en esta categoría.",
    blog: "Blog",
    categories: "Categorías",
  },
};

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale; slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { lang, slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const t = texts[lang] || texts.pt;

  const pageParam = sp?.page;
  const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const currentPage = parseInt(pageStr || '1', 10);

  const { posts, totalPages, categoryName } = await getPublishedPostsByCategory(lang, slug, currentPage);

  if (!categoryName) {
    notFound();
  }

  return (
    <div className="container px-4 md:px-8 py-12">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/blog`}>{t.blog}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{categoryName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-4xl font-extrabold mb-10 text-center">
        {t.title} <span className="text-primary">{categoryName}</span>
      </h1>

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