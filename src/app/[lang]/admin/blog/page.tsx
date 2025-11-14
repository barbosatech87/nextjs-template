import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { BlogPostsTable } from '@/components/admin/blog/blog-posts-table';
import { getAdminPosts } from '@/app/actions/blog';

interface ManageBlogPageProps {
  params: { lang: Locale };
}

export default async function ManageBlogPage({ params }: ManageBlogPageProps) {
  const { lang } = params;
  const posts = await getAdminPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {lang === 'pt' ? 'Gerenciar Blog' : 'Manage Blog'}
          </h1>
          <p className="text-muted-foreground">
            {lang === 'pt' ? 'Crie, edite e gerencie suas postagens.' : 'Create, edit, and manage your posts.'}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/blog/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {lang === 'pt' ? 'Novo Post' : 'New Post'}
          </Link>
        </Button>
      </div>
      <BlogPostsTable posts={posts} lang={lang} />
    </div>
  );
}