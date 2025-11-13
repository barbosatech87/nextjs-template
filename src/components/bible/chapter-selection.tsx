"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Locale } from '@/lib/i18n/config';

interface ChapterSelectionProps {
  totalChapters: number;
  bookSlug: string;
  lang: Locale;
}

export const ChapterSelection: React.FC<ChapterSelectionProps> = ({
  totalChapters,
  bookSlug,
  lang,
}) => {
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
      {chapters.map((chapter) => (
        <Link
          key={chapter}
          href={`/${lang}/bible/${bookSlug}/${chapter}`}
          passHref
          legacyBehavior
        >
          <Button asChild variant="outline" className="aspect-square h-auto w-full text-base">
            <a>{chapter}</a>
          </Button>
        </Link>
      ))}
    </div>
  );
};