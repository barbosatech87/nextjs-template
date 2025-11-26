import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PostListItem } from '@/app/actions/blog';
import { Locale } from '@/lib/i18n/config';
import { Calendar, Globe } from 'lucide-react';

interface PostCardProps {
  post: PostListItem;
  lang: Locale;
}

const PostCard: React.FC<PostCardProps> = ({ post, lang }) => {
  const dateLocale = lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-ES';
  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <Link href={`/${lang}/blog/${post.slug}`} className="block h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
        {post.image_url && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image 
              src={post.image_url} 
              alt={post.image_alt_text || post.title} 
              fill
              quality={65}
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <CardHeader className="flex-grow">
          <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
          {post.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
              {post.summary}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-xs text-muted-foreground space-x-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span className="uppercase">{post.language_code}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-sm font-medium text-primary hover:underline">
            {lang === 'pt' ? 'Ler mais' : lang === 'en' ? 'Read more' : 'Leer más'}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PostCard;