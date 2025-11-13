import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { BlogPostsTable } from "@/components/admin/blog/blog-posts-table";
import { LocalizedPageProps } from "@/types/next";
import { use } from "react";

export default async function AdminBlogPage({ params }: LocalizedPageProps) {
  const { lang } = use(params);
  const supabase = createSupabaseServerClient();
  
  // Usando a função RPC para buscar os posts com dados do autor
  const { data: posts, error } = await supabase.rpc('get_admin_blog_posts');

  if (error) {
    console.error("Error fetching blog posts:", error);
    return <div>Erro ao carregar os posts. Tente novamente mais tarde.</div>;
  }

  return <BlogPostsTable posts={posts || []} lang={lang} />;
}