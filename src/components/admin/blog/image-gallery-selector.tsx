"use client";

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CheckCircle, Image as ImageIcon } from 'lucide-react';
import { GeneratedImageData } from '@/app/actions/image-generation';
import { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface ImageGallerySelectorProps {
  images: GeneratedImageData[];
  lang: Locale;
  onSelectImage: (url: string) => void;
}

const texts = {
  pt: {
    select: "Selecionar",
    noImages: "Nenhuma imagem na galeria. Gere uma na aba 'Gerar com IA'.",
  },
  en: {
    select: "Select",
    noImages: "No images in the gallery. Generate one in the 'Generate with AI' tab.",
  },
  es: {
    select: "Seleccionar",
    noImages: "No hay imágenes en la galería. Genera una en la pestaña 'Generar con IA'.",
  },
};

export function ImageGallerySelector({ images, lang, onSelectImage }: ImageGallerySelectorProps) {
  const t = texts[lang] || texts.pt;

  if (images.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-lg">
        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
        <p>{t.noImages}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image) => (
        <Card 
          key={image.id} 
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectImage(image.image_url)}
        >
          <CardContent className="p-0">
            <div className="aspect-square relative">
              <Image 
                src={image.image_url} 
                alt={image.prompt} 
                layout="fill" 
                objectFit="cover" 
                unoptimized
              />
            </div>
          </CardContent>
          <CardFooter className="p-2 flex justify-center bg-muted/50">
            <Button variant="secondary" size="sm" className="w-full">
              <CheckCircle className="h-4 w-4 mr-1" /> {t.select}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}