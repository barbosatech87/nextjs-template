"use client";

import React, { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/app/actions/storage';

interface ImageUploadProps {
  lang: Locale;
  onUploadSuccess: (url: string) => void;
  initialImageUrl?: string | null;
  onRemove: () => void;
}

const texts = {
  pt: {
    upload: "Fazer Upload",
    uploading: "Enviando...",
    selectFile: "Selecione uma imagem (máx 5MB)",
    uploadSuccess: "Imagem enviada com sucesso!",
    uploadError: "Falha no upload da imagem.",
    remove: "Remover Imagem",
    fileTooLarge: "O arquivo é muito grande. O tamanho máximo é 5MB.",
  },
  en: {
    upload: "Upload",
    uploading: "Uploading...",
    selectFile: "Select an image (max 5MB)",
    uploadSuccess: "Image uploaded successfully!",
    uploadError: "Failed to upload image.",
    remove: "Remove Image",
    fileTooLarge: "File is too large. Maximum size is 5MB.",
  },
  es: {
    upload: "Subir",
    uploading: "Subiendo...",
    selectFile: "Selecciona una imagen (máx 5MB)",
    uploadSuccess: "¡Imagen subida con éxito!",
    uploadError: "Error al subir la imagen.",
    remove: "Eliminar Imagen",
    fileTooLarge: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUpload({ lang, onUploadSuccess, initialImageUrl, onRemove }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = texts[lang] || texts.pt;

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
      )}
      {!currentImageUrl && (
        <p className="text-sm text-muted-foreground">{t.selectFile}</p>
      )}
    </div>
  );
}