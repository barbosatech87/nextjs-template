"use client";

import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { getTranslatedBookName, getEnglishBookName } from '@/lib/bible-translations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Book {
  book: string; // Este é o nome do livro como vem do DB
  total_chapters: number;
}

// Estendemos a interface para incluir o nome canônico em inglês
interface CanonicalBook extends Book {
  canonicalEnglishName: string; // O nome canônico em inglês (e.g., "Revelation")
}

interface BookSelectionProps {
  books: Book[];
  lang: Locale;
}

// Ordem canônica em inglês (compatível com o banco)
const OT_ORDER: string[] = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
];

const NT_ORDER: string[] = [
  "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
  "1 John","2 John","3 John","Jude","Revelation",
];

const sectionTitles = {
  pt: {
    oldTestament: "Antigo Testamento",
    newTestament: "Novo Testamento",
  },
  en: {
    oldTestament: "Old Testament",
    newTestament: "New Testament",
  },
  es: {
    oldTestament: "Antiguo Testamento",
    newTestament: "Nuevo Testamento",
  },
};

export const BookSelection: React.FC<BookSelectionProps> = ({ books, lang }) => {
  const otBooks: CanonicalBook[] = [];
  const ntBooks: CanonicalBook[] = [];

  // Mapeia os livros recebidos para facilitar a busca, convertendo o nome do DB para o nome canônico em inglês
  const bookMap = new Map<string, CanonicalBook>();
  books.forEach(originalBook => { // Renomeado 'book' para 'originalBook' para maior clareza
    const englishCanonicalName = getEnglishBookName(originalBook.book, lang); // Converte o nome localizado do DB para o nome canônico em inglês
    if (englishCanonicalName) {
      // Armazena o livro com o nome canônico em inglês para uso posterior
      const canonicalBook: CanonicalBook = {
        book: originalBook.book, // Nome original do DB
        total_chapters: originalBook.total_chapters,
        canonicalEnglishName: englishCanonicalName, // O nome canônico em inglês
      };
      bookMap.set(englishCanonicalName, canonicalBook);
    }
  });

  // Preenche os arrays de AT e NT na ordem canônica
  OT_ORDER.forEach(bookName => {
    const book = bookMap.get(bookName);
    if (book) otBooks.push(book);
  });

  NT_ORDER.forEach(bookName => {
    const book = bookMap.get(bookName);
    if (book) ntBooks.push(book);
  });

  const currentSectionTitles = sectionTitles[lang] || sectionTitles.pt;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Antigo Testamento */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {currentSectionTitles.oldTestament} ({otBooks.length} livros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-4 gap-y-2">
            {otBooks.map((book, index) => {
              // Usa o nome canônico em inglês para obter a tradução, com fallback
              const canonicalNameForDisplay = book.canonicalEnglishName || book.book;
              const translatedName = getTranslatedBookName(canonicalNameForDisplay, lang);
              const slug = canonicalNameForDisplay.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link 
                  key={canonicalNameForDisplay} 
                  href={`/${lang}/bible/${slug}`} 
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {index + 1}. {translatedName}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Novo Testamento */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {currentSectionTitles.newTestament} ({ntBooks.length} livros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-4 gap-y-2">
            {ntBooks.map((book, index) => {
              // Usa o nome canônico em inglês para obter a tradução, com fallback
              const canonicalNameForDisplay = book.canonicalEnglishName || book.book;
              const translatedName = getTranslatedBookName(canonicalNameForDisplay, lang);
              const slug = canonicalNameForDisplay.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link 
                  key={canonicalNameForDisplay} 
                  href={`/${lang}/bible/${slug}`} 
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {index + 1}. {translatedName}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};