"use client";

import React, { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    title: "Gerar Imagem com IA",
    description: "Descreva a imagem que você deseja criar. Seja detalhado para melhores resultados.",
    promptLabel: "Prompt da Imagem",
    promptPlaceholder: "Ex: Um leão majestoso em um campo florido ao pôr do sol, estilo pintura a óleo.",
    generate: "Gerar Imagem",
    generating: "Gerando...",
    success: "Imagem gerada com sucesso! Revise e salve.",
    error: "Falha ao gerar imagem. Tente novamente.",
    save: "Salvar e Selecionar", // Alterado para refletir a seleção
    saving: "Salvando...",
    discard: "Descartar e Gerar Nova",
    saveSuccess: "Imagem salva e selecionada com sucesso!",
    saveError: "Falha ao salvar imagem.",
  },
  en: {
    title: "Generate Image with AI",
    description: "Describe the image you want to create. Be detailed for best results.",
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
    title: "Generar Imagen con IA",
    description: "Describe la imagen que quieres crear. Sé detallado para obtener mejores resultados.",
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

interface AiImageGeneratorFormProps {
  lang: Locale;
  // Novo: Para uso dentro do modal de seleção
  initialPrompt?: string;
  onImageSave?: (url: string) => void;
}

export function AiImageGeneratorForm({ lang, initialPrompt, onImageSave }: AiImageGeneratorFormProps) {
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

  // Atualiza o prompt inicial se ele mudar (ex: ao abrir o modal)
  useEffect(() => {
    if (initialPrompt) {
      form.setValue('prompt', initialPrompt);
    }
  }, [initialPrompt, form]);

  const onSubmit = (values: ImageFormValues) => {
    setGeneratedImageUrl(null); // Limpa a imagem anterior
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

  const handleSave = () => {
    if (!generatedImageUrl || !currentPrompt) return;

    startSavingTransition(async () => {
      const result = await saveGeneratedImage(currentPrompt, generatedImageUrl);
      if (result.success) {
        toast.success(t.saveSuccess);
        
        // Se estiver sendo usado dentro do modal de seleção, chama o callback
        if (onImageSave) {
          onImageSave(generatedImageUrl);
        } else {
          // Se estiver na página de galeria, apenas limpa e revalida
          setGeneratedImageUrl(null);
          setCurrentPrompt('');
          form.reset();
        }
      } else {
        toast.error(result.message || t.saveError);
      }
    });
  };

  const handleDiscard = () => {
    setGeneratedImageUrl(null);
    setCurrentPrompt('');
    // Não reseta o prompt do formulário para que o usuário possa tentar novamente facilmente
  };

  // Se estiver no modo de seleção (dentro do modal), remove o CardHeader e CardDescription
  const isModalMode = !!onImageSave;

  return (
    <Card className={isModalMode ? "border-none shadow-none" : ""}>
      {!isModalMode && (
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={isModalMode ? "p-0" : ""}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    layout="fill" 
                    objectFit="cover" 
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
              <Button type="submit" disabled={isPending} className="w-full">
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}