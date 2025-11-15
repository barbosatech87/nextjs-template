import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';

interface ReadBibleCtaProps {
  lang: Locale;
  texts: {
    title: string;
    description: string;
    button: string;
  };
}

export const ReadBibleCta: React.FC<ReadBibleCtaProps> = ({ lang, texts }) => {
  return (
    <section className="w-full py-12 md:py-16">
      <Card className="w-full max-w-4xl mx-auto text-center bg-secondary/50 border-dashed">
        <CardHeader className="items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-2">
            <BookMarked className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{texts.title}</CardTitle>
          <CardDescription className="max-w-xl mx-auto">
            {texts.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href={`/${lang}/bible`}>
              {texts.button}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};