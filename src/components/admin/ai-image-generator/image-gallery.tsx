"use client";

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteGeneratedImage, GeneratedImageData } from '@/app/actions/image-generation';
import { Locale } from '@/lib/i18n/config';

interface ImageGalleryProps {
  images: GeneratedImageData[];
  lang: Locale;
}

const texts = {
  pt: {
    title: "Galeria de Imagens Geradas",
    noImages: "Nenhuma imagem gerada ainda. Use o formulário acima para criar uma.",
    copyUrl: "Copiar URL",
    delete: "Deletar",
    urlCopied: "URL copiada para a área de transferência!",
    deleteConfirm: "Tem certeza que deseja deletar esta imagem?",
    deleteSuccess: "Imagem deletada com sucesso.",
    deleteError: "Erro ao deletar imagem.",
  },
  en: {
    title: "Generated Image Gallery",
    noImages: "No images generated yet. Use the form above to create one.",
    copyUrl: "Copy URL",
    delete: "Delete",
    urlCopied: "URL copied to clipboard!",
    deleteConfirm: "Are you sure you want to delete this image?",
    deleteSuccess: "Image deleted successfully.",
    deleteError: "Error deleting image.",
  },
  es: {
    title: "Galería de Imágenes Generadas",
    noImages: "Aún no se han generado imágenes. Utilice el formulario de arriba para crear una.",
    copyUrl: "Copiar URL",
    delete: "Eliminar",
    urlCopied: "¡URL copiada al portapapeles!",
    deleteConfirm: "¿Estás seguro de que quieres eliminar esta imagen?",
    deleteSuccess: "Imagen eliminada con éxito.",
    deleteError: "Error al eliminar la imagen.",
  }
};

export function ImageGallery({ images, lang }: ImageGalleryProps) {
  const t = texts[lang] || texts.pt;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(t.urlCopied);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      const result = await deleteGeneratedImage(id);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        toast.error(result.message || t.deleteError);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="text-muted-foreground">{t.noImages}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <Image src={image.image_url} alt={image.prompt} layout="fill" objectFit="cover" />
                  </div>
                </CardContent>
                <CardFooter className="p-2 flex justify-between bg-muted/50">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(image.image_url)}>
                    <Copy className="h-4 w-4 mr-1" /> {t.copyUrl}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(image.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}