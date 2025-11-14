"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Image, Sparkles, GalleryHorizontal } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { ImageGallerySelector } from './image-gallery-selector';
import { GeneratedImageData } from '@/app/actions/image-generation';
import { AiImageGeneratorModalForm } from '../ai-image-generator/ai-image-generator-modal-form'; // Import corrigido

interface ImageSelectorDialogProps {
  lang: Locale;
  trigger: React.ReactNode;
  initialPrompt?: string;
  onSelectImage: (url: string) => void;
  onOpenChange: (open: boolean) => void;
  images: GeneratedImageData[];
}

const texts = {
  pt: {
    title: "Gerar ou Selecionar Imagem de Capa",
    tabGenerate: "Gerar com IA",
    tabGallery: "Minha Galeria",
  },
  en: {
    title: "Generate or Select Cover Image",
    tabGenerate: "Generate with AI",
    tabGallery: "My Gallery",
  },
  es: {
    title: "Generar o Seleccionar Imagen de Portada",
    tabGenerate: "Generar con IA",
    tabGallery: "Mi Galería",
  },
};

export function ImageSelectorDialog({ 
  lang, 
  trigger, 
  initialPrompt = '', 
  onSelectImage, 
  onOpenChange,
  images,
}: ImageSelectorDialogProps) {
  const t = texts[lang] || texts.pt;
  const [open, setOpen] = useState(false);

  const handleSelect = (url: string) => {
    onSelectImage(url);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t.tabGenerate}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <GalleryHorizontal className="h-4 w-4" />
              {t.tabGallery}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="mt-4">
            <AiImageGeneratorModalForm 
              lang={lang} 
              initialPrompt={initialPrompt} 
              onImageSave={handleSelect} // Quando a imagem é salva, ela é selecionada
            />
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-4">
            <ImageGallerySelector 
              images={images} 
              lang={lang} 
              onSelectImage={handleSelect} 
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}