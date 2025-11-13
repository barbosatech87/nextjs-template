"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface BibleNavigationProps {
  lang: Locale;
  bookName: string;
  bookSlug: string;
  chapter: number;
  totalChapters: number;
  texts: {
    bible: string;
    previous: string;
    next: string;
  };
}

export const BibleNavigation: React.FC<BibleNavigationProps> = ({
  lang,
  bookName,
  bookSlug,
  chapter,
  totalChapters,
  texts,
}) => {
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < totalChapters ? chapter + 1 : null;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/bible`}>{texts.bible}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/bible/${bookSlug}`}>{bookName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Capítulo {chapter}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        {prevChapter ? (
          <Button asChild variant="outline">
            <Link href={`/${lang}/bible/${bookSlug}/${prevChapter}`}>
              <ChevronLeft />
              {texts.previous}
            </Link>
          </Button>
        ) : (
          <div /> // Placeholder for alignment
        )}
        {nextChapter ? (
          <Button asChild variant="outline">
            <Link href={`/${lang}/bible/${bookSlug}/${nextChapter}`}>
              {texts.next}
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <div /> // Placeholder for alignment
        )}
      </div>
    </div>
  );
};