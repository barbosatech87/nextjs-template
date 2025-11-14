"use client";

import React, { useTransition } from 'react';
import { GeneratedImage, deleteGeneratedImage } from '@/app/actions/image-generation';
import { Locale } from '@/lib/i18n/config';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImageGalleryProps {
  images: GeneratedImage[];
  lang: Locale;
}

const texts = {
  pt: {
    title: "Galeria de Imagens Geradas",
    noImages: "Nenhuma imagem gerada ainda.",
    deleteConfirmTitle: "Excluir Imagem?",
    deleteConfirmDesc: "Esta ação é irreversível e removerá a imagem do banco de dados e do armazenamento.",
    cancel: "Cancelar",
    delete: "Excluir",
    deleteSuccess: "Imagem excluída com sucesso.",
    deleteError: "Erro ao excluir imagem.",
    copyUrl: "Copiar URL",
    copied: "Copiado!",
    prompt: "Prompt:",
    generatedOn: "Gerado em:",
  },
  en: {
    title: "Generated Image Gallery",
    noImages: "No images generated yet.",
    deleteConfirmTitle: "Delete Image?",
    deleteConfirmDesc: "This action is irreversible and will remove the image from the database and storage.",
    cancel: "Cancel",
    delete: "Delete",
    deleteSuccess: "Image deleted successfully.",
    deleteError: "Error deleting image.",
    copyUrl: "Copy URL",
    copied: "Copied!",
    prompt: "Prompt:",
    generatedOn: "Generated on:",
  },
  es: {
    title: "Galería de Imágenes Generadas",
    noImages: "Aún no se han generado imágenes.",
    deleteConfirmTitle: "¿Eliminar Imagen?",
    deleteConfirmDesc: "Esta acción es irreversible y eliminará la imagen de la base de datos y del almacenamiento.",
    cancel: "Cancelar",
    delete: "Eliminar",
    deleteSuccess: "Imagen eliminada con éxito.",
    deleteError: "Error al eliminar la imagen.",
    copyUrl: "Copiar URL",
    copied: "¡Copiado!",
    prompt: "Prompt:",
    generatedOn: "Generado el:",
  },
};

export function ImageGallery({ images, lang }: ImageGalleryProps) {
  const [isPending, startTransition] = useTransition();
  const t = texts[lang] || texts.pt;

  const handleDelete = (imageId: string, imageUrl: string) => {
    startTransition(async () => {
      const result = await deleteGeneratedImage(imageId, imageUrl, lang);
      if (result.success) {
        toast.success(t.deleteSuccess);
      } else {
        toast.error(result.message || t.deleteError);
      }
    });
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(t.copied);
  };

  if (images.length === 0) {
    return (
      <Card className="text-center py-10">
        <CardTitle className="text-xl text-muted-foreground">{t.noImages}</CardTitle>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className="flex flex-col">
              <CardHeader className="p-0">
                <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
                  <img 
                    src={image.image_url} 
                    alt={image.prompt} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <p className="text-sm font-medium line-clamp-2">
                  <span className="font-bold">{t.prompt}</span> {image.prompt}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t.generatedOn} {new Date(image.created_at).toLocaleDateString(lang)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleCopy(image.image_url)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.copyUrl}</TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(image.id, image.image_url)}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}