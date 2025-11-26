import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Locale } from '@/lib/i18n/config';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { BookOpen } from 'lucide-react';
import { DailyVerseData } from '@/app/actions/blog';

interface DailyVerseProps {
  verse: DailyVerseData | null;
  lang: Locale;
  texts: {
    title: string;
    readChapter: string;
    verseUnavailable: string;
  };
}

export const DailyVerse: React.FC<DailyVerseProps> = ({ verse, lang, texts }) => {
  if (!verse) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{texts.verseUnavailable}</p>
        </CardContent>
      </Card>
    );
  }

  const translatedBookName = getTranslatedBookName(verse.book, lang);
  const bookSlug = verse.book.toLowerCase().replace(/\s+/g, '-');
  const reference = `${translatedBookName} ${verse.chapter}:${verse.verse_number}`;
  const chapterUrl = `/${lang}/bible/${bookSlug}/${verse.chapter}`;

  return (
    <Card className="w-full max-w-4xl mx-auto text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{texts.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="text-xl md:text-2xl italic font-serif text-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </blockquote>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-semibold text-lg text-primary">{reference}</p>
        <Button asChild>
          <Link href={chapterUrl}>
            <BookOpen className="mr-2 h-4 w-4" />
            {texts.readChapter}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};