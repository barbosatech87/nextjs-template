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

  const texts = {
    pt: {
      title: 'Gerenciar Blog',
      description: 'Crie, edite e gerencie suas postagens.',
      newPost: 'Novo Post',
    },
    en: {
      title: 'Manage Blog',
      description: 'Create, edit, and manage your posts.',
      newPost: 'New Post',
    },
    es: {
      title: 'Gestionar Blog',
      description: 'Crea, edita y gestiona tus entradas.',
      newPost: 'Nueva Entrada',
    },
  };

  const t = texts[lang] || texts.pt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t.title}
          </h1>
          <p className="text-muted-foreground">
            {t.description}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/blog/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t.newPost}
          </Link>
        </Button>
      </div>
      <BlogPostsTable posts={posts} lang={lang} />
    </div>
  );
}