import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    slug: string;
    poster_image_src: string | null;
  };
  lang: Locale;
}

export function StoryCard({ story, lang }: StoryCardProps) {
  return (
    <Link href={`/${lang}/web-stories/${story.slug}`} className="block group">
      <div className="relative aspect-[9/16] w-full bg-muted rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
        {story.poster_image_src ? (
          <Image
            src={story.poster_image_src}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <PlayCircle className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-white font-bold text-lg line-clamp-3">{story.title}</h3>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-16 h-16 text-white" />
        </div>
      </div>
    </Link>
  );
}