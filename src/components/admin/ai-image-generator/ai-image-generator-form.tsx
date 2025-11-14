"use client";

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateImageAction } from '@/app/actions/ai';
import { Locale } from '@/lib/i18n/config';

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
    success: "Imagem gerada com sucesso! Verifique a galeria abaixo.",
    error: "Falha ao gerar imagem. Tente novamente.",
  },
  en: {
    title: "Generate Image with AI",
    description: "Describe the image you want to create. Be detailed for best results.",
    promptLabel: "Image Prompt",
    promptPlaceholder: "Ex: A majestic lion in a flowery field at sunset, oil painting style.",
    generate: "Generate Image",
    generating: "Generating...",
    success: "Image generated successfully! Check the gallery below.",
    error: "Failed to generate image. Please try again.",
  },
  es: {
    title: "Generar Imagen con IA",
    description: "Describe la imagen que quieres crear. Sé detallado para obtener mejores resultados.",
    promptLabel: "Prompt de la Imagen",
    promptPlaceholder: "Ej: Un león majestuoso en un campo de flores al atardecer, estilo pintura al óleo.",
    generate: "Generar Imagen",
    generating: "Generando...",
    success: "¡Imagen generada con éxito! Revisa la galería de abajo.",
    error: "Error al generar la imagen. Inténtalo de nuevo.",
  }
};

interface AiImageGeneratorFormProps {
  lang: Locale;
}

export function AiImageGeneratorForm({ lang }: AiImageGeneratorFormProps) {
  const [isPending, startTransition] = useTransition();
  const t = texts[lang] || texts.pt;

  const form = useForm<ImageFormValues>({
    resolver: zodResolver(imageSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = (values: ImageFormValues) => {
    startTransition(async () => {
      const result = await generateImageAction(values.prompt);
      if (result.success) {
        toast.success(t.success);
        form.reset();
      } else {
        toast.error(result.message || t.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}