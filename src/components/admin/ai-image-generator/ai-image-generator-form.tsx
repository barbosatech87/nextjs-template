"use client";

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Save, RotateCcw } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { generateImage } from '@/app/actions/image-generation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AiImageGeneratorFormProps {
  lang: Locale;
}

const formSchema = z.object({
  prompt: z.string().min(10, { message: "O prompt deve ter pelo menos 10 caracteres." }).max(1000),
});

type FormValues = z.infer<typeof formSchema>;

const texts = {
  pt: {
    title: "Gerador de Imagens com IA",
    description: "Descreva o conceito da imagem que você precisa para o seu post. A IA irá criar uma imagem conceitual, sem texto.",
    promptLabel: "Prompt de Imagem",
    promptPlaceholder: "Ex: Um pastor de ovelhas olhando para o céu estrelado, estilo pintura a óleo.",
    generate: "Gerar Imagem",
    generating: "Gerando...",
    imagePreview: "Prévia da Imagem",
    saveSuccess: "Imagem salva na galeria!",
    saveError: "Erro ao salvar a imagem.",
    generateNew: "Gerar Nova",
    saveToGallery: "Salvar na Galeria",
    generationError: "Falha na geração: ",
  },
  en: {
    title: "AI Image Generator",
    description: "Describe the concept of the image you need for your post. The AI will create a conceptual image, without text.",
    promptLabel: "Image Prompt",
    promptPlaceholder: "Ex: A shepherd looking at the starry sky, oil painting style.",
    generate: "Generate Image",
    generating: "Generating...",
    imagePreview: "Image Preview",
    saveSuccess: "Image saved to gallery!",
    saveError: "Error saving image.",
    generateNew: "Generate New",
    saveToGallery: "Save to Gallery",
    generationError: "Generation failed: ",
  },
  es: {
    title: "Generador de Imágenes con IA",
    description: "Describe el concepto de la imagen que necesitas para tu entrada. La IA creará una imagen conceptual, sin texto.",
    promptLabel: "Prompt de Imagen",
    promptPlaceholder: "Ej: Un pastor de ovejas mirando el cielo estrellado, estilo pintura al óleo.",
    generate: "Generar Imagen",
    generating: "Generando...",
    imagePreview: "Vista Previa de la Imagen",
    saveSuccess: "¡Imagen guardada en la galería!",
    saveError: "Error al guardar la imagen.",
    generateNew: "Generar Nueva",
    saveToGallery: "Guardar en Galería",
    generationError: "Fallo en la generación: ",
  },
};

export function AiImageGeneratorForm({ lang }: AiImageGeneratorFormProps) {
  const t = texts[lang] || texts.pt;
  const [isPending, startTransition] = useTransition();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  const handleGenerate = (values: FormValues) => {
    setGeneratedImageUrl(null);
    setLastPrompt(null);
    
    startTransition(async () => {
      const result = await generateImage(values.prompt, lang);

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        setLastPrompt(values.prompt);
        toast.success(t.saveSuccess); // A imagem é salva automaticamente no Server Action
      } else {
        toast.error(t.generationError + (result.message || "Tente novamente."));
      }
    });
  };

  const handleGenerateNew = () => {
    setGeneratedImageUrl(null);
    setLastPrompt(null);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.promptLabel}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t.promptPlaceholder} 
                      rows={5} 
                      {...field} 
                      disabled={isPending || !!generatedImageUrl}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !!generatedImageUrl}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t.generate}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Prévia da Imagem */}
        {generatedImageUrl && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">{t.imagePreview}</h3>
            <div className="relative w-full aspect-square border rounded-lg overflow-hidden">
              <img 
                src={generatedImageUrl} 
                alt={lastPrompt || "Imagem gerada por IA"} 
                className={cn("w-full h-full object-cover", isPending && "opacity-50")}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleGenerateNew} disabled={isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.generateNew}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}