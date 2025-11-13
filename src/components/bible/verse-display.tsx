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
    <div className="prose prose-lg lg:prose-xl max-w-none font-serif leading-relaxed text-foreground">
      <p>
        {verses.map((verse) => (
          <React.Fragment key={verse.verse_number}>
            <sup className="font-sans font-bold text-primary text-sm top-[-0.5em] mr-1">
              {verse.verse_number}
            </sup>
            <span className="break-words">{verse.text} </span>
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};