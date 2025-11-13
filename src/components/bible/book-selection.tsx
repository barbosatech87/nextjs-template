"use client";

import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Book {
  book: string;
  total_chapters: number;
}

interface BookSelectionProps {
  books: Book[];
  lang: Locale;
}

export const BookSelection: React.FC<BookSelectionProps> = ({ books, lang }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {books.map((book) => {
        const translatedName = getTranslatedBookName(book.book, lang);
        const slug = book.book.toLowerCase().replace(/\s+/g, '-');

        return (
          <Link key={book.book} href={`/${lang}/bible/${slug}`} legacyBehavior>
            <a className="block">
              <Card className="h-full transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-center">
                    {translatedName}
                  </CardTitle>
                </CardHeader>
              </Card>
            </a>
          </Link>
        );
      })}
    </div>
  );
};