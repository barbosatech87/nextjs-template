"use client";

import React from 'react';
import { Verse } from '@/types/supabase';

interface VerseDisplayProps {
  verses: Pick<Verse, 'verse_number' | 'text'>[];
}

export const VerseDisplay: React.FC<VerseDisplayProps> = ({ verses }) => {
  if (!verses || verses.length === 0) {
    return <p>Nenhum versículo encontrado para este capítulo.</p>;
  }

  return (
    <div className="prose prose-lg lg:prose-xl max-w-none font-serif text-foreground">
      {verses.map((verse) => (
        <p key={verse.verse_number} className="mb-4 leading-relaxed">
          <sup className="font-sans font-bold text-primary text-sm top-[-0.5em] mr-1">
            {verse.verse_number}
          </sup>
          <span className="break-words">{verse.text}</span>
        </p>
      ))}
    </div>
  );
};