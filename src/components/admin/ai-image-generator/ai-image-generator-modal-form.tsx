"use client";

import React, { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateImageAction, saveGeneratedImage } from '@/app/actions/ai';
import { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

const imageSchema = z.object({
  prompt: z.string().min(10, { message: "O prompt deve ter pelo menos 10 caracteres." }),
});

type ImageFormValues = z.infer<typeof imageSchema>;

const texts = {
  pt: {
    promptLabel: "Prompt da Imagem",
    promptPlaceholder: "Ex: Um leão majestoso em um campo florido ao pôr do sol, estilo pintura a óleo.",
    generate: "Gerar Imagem",
    generating: "Gerando...",
    success: "Imagem gerada com sucesso! Revise e salve.",
    error: "Falha ao gerar imagem. Tente novamente.",
    save: "Salvar e Selecionar",
    saving: "Salvando...",
    discard: "Descartar e Gerar Nova",
    saveSuccess: "Imagem salva e selecionada com sucesso!",
    saveError: "Falha ao salvar imagem.",
  },
  en: {
    promptLabel: "Image Prompt",
    promptPlaceholder: "Ex: A majestic lion in a flowery field at sunset, oil painting style.",
    generate: "Generate Image",
    generating: "Generating...",
    success: "Image generated successfully! Review and save.",
    error: "Failed to generate image. Please try again.",
    save: "Save and Select",
    saving: "Saving...",
    discard: "Discard and Generate New",
    saveSuccess: "Image successfully saved and selected!",
    saveError: "Failed to save image.",
  },
  es: {
    promptLabel: "Prompt de la Imagen",
    promptPlaceholder: "Ej: Un león majestuoso en un campo de flores al atardecer, estilo pintura al óleo.",
    generate: "Generar Imagen",
    generating: "Generando...",
    success: "¡Imagen generada con éxito! Revisa y guarda.",
    error: "Error al generar la imagen. Inténtalo de nuevo.",
    save: "Guardar y Seleccionar",
    saving: "Guardando...",
    discard: "Descartar y Generar Nueva",
    saveSuccess: "¡Imagen guardada y seleccionada con éxito!",
    saveError: "Error al guardar la imagen.",
  }
};

interface AiImageGeneratorModalFormProps {
  lang: Locale;
  initialPrompt?: string;
  onImageSave: (url: string) => void;
}

export function AiImageGeneratorModalForm({ lang, initialPrompt, onImageSave }: AiImageGeneratorModalFormProps) {
  const [isPending, startTransition] = useTransition();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isSaving, startSavingTransition] = useTransition();
  
  const t = texts[lang] || texts.pt;

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      prompt: initialPrompt || '',
    },
  });

  useEffect(() => {
    if (initialPrompt) {
      form.setValue('prompt', initialPrompt);
    }
  }, [initialPrompt, form]);

  const onSubmit = (values: ImageFormValues) => {
    setGeneratedImageUrl(null);
    setCurrentPrompt(values.prompt);
    
    startTransition(async () => {
      const result = await generateImageAction(values.prompt);
      if (result.success && result.url) {
        toast.success(t.success);
        setGeneratedImageUrl(result.url);
      } else {
        toast.error(result.message || t.error);
      }
    });
  };

  const handleGenerateClick = () => {
    // Usa a validação do RHF sem submeter um <form>, evitando submit do PostForm pai
    form.handleSubmit(onSubmit)();
  };

  const handleSave = () => {
    if (!generatedImageUrl || !currentPrompt) return;

    startSavingTransition(async () => {
      const result = await saveGeneratedImage(currentPrompt, generatedImageUrl);
      if (result.success) {
        toast.success(t.saveSuccess);
        onImageSave(generatedImageUrl);
      } else {
        toast.error(result.message || t.saveError);
      }
    });
  };

  const handleDiscard = () => {
    setGeneratedImageUrl(null);
    setCurrentPrompt('');
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.promptLabel}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.promptPlaceholder}
                  rows={4}
                  {...field}
                  disabled={isPending || !!generatedImageUrl}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {generatedImageUrl && (
          <div className="space-y-4 flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border">
              <Image 
                src={generatedImageUrl} 
                alt={currentPrompt} 
                fill 
                style={{ objectFit: 'cover' }} 
                unoptimized
              />
            </div>
            <div className="flex gap-2 w-full max-w-md">
              <Button 
                type="button" 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? t.saving : t.save}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDiscard}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                {t.discard}
              </Button>
            </div>
          </div>
        )}

        {!generatedImageUrl && (
          <Button type="button" onClick={handleGenerateClick} disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.generating}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t.generate}
              </>
            )}
          </Button>
        )}
      </div>
    </Form>
  );
}