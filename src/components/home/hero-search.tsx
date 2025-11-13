"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface HeroSearchProps {
  lang: Locale;
  texts: {
    placeholder: string;
    button: string;
  };
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ lang, texts }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full max-w-2xl items-center space-x-2">
      <Input
        type="search"
        placeholder={texts.placeholder}
        className="flex-1 text-base py-6"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit" size="lg">
        <Search className="mr-2 h-5 w-5" />
        {texts.button}
      </Button>
    </form>
  );
};