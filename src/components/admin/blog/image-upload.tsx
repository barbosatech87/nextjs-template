"use client";

import React, { useState, useTransition, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Sparkles, GalleryHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/app/actions/storage';
import { ImageSelectorDialog } from './image-selector-dialog';
import { getGeneratedImages, GeneratedImageData } from '@/app/actions/image-generation';

interface ImageUploadProps {
  lang: Locale;
  onUploadSuccess: (url: string) => void;
  initialImageUrl?: string | null;
  onRemove: () => void;
  postSummary: string | null;
  initialImages: GeneratedImageData[]; // Nova prop
}

const texts = {
  pt: {
    upload: "Fazer Upload Manual",
    uploading: "Enviando...",
    selectFile: "Selecione uma imagem (máx 5MB)",
    uploadSuccess: "Imagem enviada com sucesso!",
    uploadError: "Falha no upload da imagem.",
    remove: "Remover Imagem",
    fileTooLarge: "O arquivo é muito grande. O tamanho máximo é 5MB.",
    generateOrSelect: "Gerar / Galeria",
    summaryRequired: "Preencha o Resumo do Post para gerar uma imagem com IA.",
    fetchingGallery: "Carregando galeria...",
  },
  en: {
    upload: "Manual Upload",
    uploading: "Uploading...",
    selectFile: "Select an image (max 5MB)",
    uploadSuccess: "Image uploaded successfully!",
    uploadError: "Failed to upload image.",
    remove: "Remove Image",
    fileTooLarge: "File is too large. Maximum size is 5MB.",
    generateOrSelect: "Generate / Gallery",
    summaryRequired: "Fill in the Post Summary to generate an image with AI.",
    fetchingGallery: "Fetching gallery...",
  },
  es: {
    upload: "Subir Manualmente",
    uploading: "Subiendo...",
    selectFile: "Selecciona una imagen (máx 5MB)",
    uploadSuccess: "¡Imagen subida con éxito!",
    uploadError: "Error al subir la imagen.",
    remove: "Eliminar Imagen",
    fileTooLarge: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
    generateOrSelect: "Generar / Galería",
    summaryRequired: "Rellena el Resumen de la Entrada para generar una imagen con IA.",
    fetchingGallery: "Cargando galería...",
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUpload({ lang, onUploadSuccess, initialImageUrl, onRemove, postSummary, initialImages }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Usamos o estado local para a galeria, inicializado com a prop do servidor
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[]>(initialImages);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  
  const t = texts[lang] || texts.pt;

  const isSummaryValid = !!postSummary && postSummary.length > 10;

  // Função para recarregar a galeria (usada ao abrir o modal ou após salvar uma nova imagem)
  const fetchImages = useCallback(async () => {
    setIsGalleryLoading(true);
    const images = await getGeneratedImages();
    setGeneratedImages(images);
    setIsGalleryLoading(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      // Recarrega a galeria apenas se estiver abrindo
      fetchImages();
    }
  };

  const handleGenerateOrSelectClick = () => {
    if (!isSummaryValid) {
      toast.warning(t.summaryRequired);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(t.fileTooLarge);
        setFile(null);
        e.target.value = ''; // Limpa o input
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    startTransition(async () => {
      const result = await uploadImage(file);
      if (result.success && result.url) {
        toast.success(t.uploadSuccess);
        onUploadSuccess(result.url);
        setFile(null);
      } else {
        toast.error(result.message || t.uploadError);
      }
    });
  };

  const handleRemove = () => {
    onRemove();
    setFile(null);
  };

  const currentImageUrl = initialImageUrl;

  return (
    <div className="space-y-4">
      {currentImageUrl ? (
        <div className="relative w-full h-48 border rounded-lg overflow-hidden group">
          <img 
            src={currentImageUrl} 
            alt="Post cover" 
            className="w-full h-full object-cover" 
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          {/* Botão Gerar/Galeria */}
          <ImageSelectorDialog
            lang={lang}
            initialPrompt={postSummary || undefined}
            onSelectImage={(url) => {
              onUploadSuccess(url);
              // Após selecionar/salvar, recarrega a galeria para incluir a nova imagem
              fetchImages(); 
            }}
            onOpenChange={handleOpenChange}
            images={generatedImages}
            isGalleryLoading={isGalleryLoading} // Passando o estado de loading
            trigger={
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full"
                disabled={!isSummaryValid}
                onClick={handleGenerateOrSelectClick}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t.generateOrSelect}
              </Button>
            }
          />
          
          <div className="flex items-center justify-center my-2">
            <span className="text-xs text-muted-foreground">OU</span>
          </div>

          {/* Upload Manual */}
          <div className={cn("flex flex-col sm:flex-row gap-2", currentImageUrl && "hidden")}>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="flex-1"
              disabled={isPending}
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isPending ? t.uploading : t.upload}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">{t.selectFile}</p>
        </>
      )}
    </div>
  );
}