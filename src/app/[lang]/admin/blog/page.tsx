import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { BlogPostsTable } from "@/components/admin/blog/blog-posts-table";
import { Locale } from "@/lib/i18n/config";
import { LocalizedPageProps } from "@/types/next-app";

export default async function AdminBlogPage({ params }: LocalizedPageProps) {
  const { lang } = params;
  const supabase = createSupabaseServerClient();
  
  const { data: posts, error } = await supabase.rpc('get_admin_blog_posts');

  if (error) {
    console.error("Error fetching blog posts:", error);
    return <div>Erro ao carregar os posts. Tente novamente mais tarde.</div>;
  }

  return <BlogPostsTable posts={posts || []} lang={lang} />;
}