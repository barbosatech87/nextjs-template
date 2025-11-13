"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface PaginationControlsProps {
  totalPages: number;
  currentPage: number;
  lang: Locale;
}

const texts = {
  pt: {
    previous: "Anterior",
    next: "Próxima",
    page: "Página",
    of: "de",
  },
  en: {
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
  },
  es: {
    previous: "Anterior",
    next: "Siguiente",
    page: "Página",
    of: "de",
  },
};

export function PaginationControls({ totalPages, currentPage, lang }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = texts[lang] || texts.pt;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page));
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={isFirstPage}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        {t.previous}
      </Button>

      <div className="text-sm text-muted-foreground">
        {t.page} {currentPage} {t.of} {totalPages}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={isLastPage}
      >
        {t.next}
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}