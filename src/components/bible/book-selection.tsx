"use client";

import React from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { getTranslatedBookName, convertRomanToArabic } from '@/lib/bible-translations'; // Importa convertRomanToArabic
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Book {
  book: string;
  total_chapters: number;
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
  const otBooks: Book[] = [];
  const ntBooks: Book[] = [];

  // Mapeia os livros recebidos para facilitar a busca, normalizando os nomes
  const bookMap = new Map<string, Book>();
  books.forEach(book => {
    const canonicalBookName = convertRomanToArabic(book.book); // Normaliza o nome do livro do DB
    bookMap.set(canonicalBookName, book);
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {otBooks.map((book, index) => {
              const translatedName = getTranslatedBookName(book.book, lang);
              const slug = book.book.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link 
                  key={book.book} 
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {ntBooks.map((book, index) => {
              const translatedName = getTranslatedBookName(book.book, lang);
              const slug = book.book.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link 
                  key={book.book} 
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