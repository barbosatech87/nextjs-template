import React from 'react';
import { PostListItem } from '@/app/actions/blog';
import { Locale } from '@/lib/i18n/config';
import PostCard from '@/components/blog/post-card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PostSectionProps {
  title: string;
  posts: PostListItem[];
  lang: Locale;
  viewAllLink?: string;
  viewAllText?: string;
}

export const PostSection: React.FC<PostSectionProps> = ({ title, posts, lang, viewAllLink, viewAllText }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {viewAllLink && viewAllText && (
          <Button asChild variant="ghost">
            <Link href={viewAllLink}>
              {viewAllText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} lang={lang} />
        ))}
      </div>
    </section>
  );
};