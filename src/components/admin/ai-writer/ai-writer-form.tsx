"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { Locale } from "@/lib/i18n/config";
import { getBibleMetadata, generatePostWithAI, AIResponse } from "@/app/actions/ai";
import { getTranslatedBookName } from "@/lib/bible-translations";

interface AiWriterFormProps {
  lang: Locale;
}

type BibleMetadata = { book: string; total_chapters: number };

const formSchema = z.object({
  type: z.enum(["devotional", "thematic", "summary"], {
    required_error: "Você deve selecionar um tipo de conteúdo.",
  }),
  theme: z.string().optional(),
  book: z.string().optional(),
  chapter: z.string().optional(),
  verse: z.string().optional(),
}).refine(data => {
    if (data.type === 'thematic') return !!data.theme && data.theme.length > 2;
    if (data.type === 'devotional') return !!data.book && !!data.chapter && !!data.verse;
    if (data.type === 'summary') return !!data.book && !!data.chapter;
    return false;
}, {
    message: "Por favor, preencha os campos necessários para o tipo selecionado.",
    path: ['type'],
});

type FormValues = z.infer<typeof formSchema>;

export function AiWriterForm({ lang }: AiWriterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bibleMetadata, setBibleMetadata] = useState<BibleMetadata[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "devotional" },
  });

  const generationType = form.watch("type");
  const selectedBook = form.watch("book");

  useEffect(() => {
    async function fetchMetadata() {
      setIsLoadingMetadata(true);
      const data = await getBibleMetadata(lang);
      setBibleMetadata(data);
      setIsLoadingMetadata(false);
    }
    fetchMetadata();
  }, [lang]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const request = {
        lang,
        type: values.type,
        context: {
          theme: values.theme,
          book: values.book,
          chapter: values.chapter ? parseInt(values.chapter, 10) : undefined,
          verse: values.verse ? parseInt(values.verse, 10) : undefined,
        },
      };

      const result = await generatePostWithAI(request);

      if (result.success && result.data) {
        toast.success("Conteúdo gerado com sucesso! Redirecionando...");
        const query = new URLSearchParams({
          initialData: JSON.stringify(result.data),
        });
        router.push(`/${lang}/admin/blog/new?${query.toString()}`);
      } else {
        toast.error(result.message || "Ocorreu um erro desconhecido.");
      }
    });
  };

  const renderConditionalFields = () => {
    const bookData = bibleMetadata.find(b => b.book === selectedBook);
    const chapters = bookData ? Array.from({ length: bookData.total_chapters }, (_, i) => i + 1) : [];

    if (isLoadingMetadata) {
        return <Skeleton className="h-24 w-full" />
    }

    switch (generationType) {
      case "devotional":
        return (
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="book" render={({ field }) => (
              <FormItem>
                <FormLabel>Livro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o livro" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {bibleMetadata.map(b => <SelectItem key={b.book} value={b.book}>{getTranslatedBookName(b.book, lang)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="chapter" render={({ field }) => (
              <FormItem>
                <FormLabel>Capítulo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBook}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o capítulo" /></SelectTrigger></FormControl>
                  <SelectContent>{chapters.map(c => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="verse" render={({ field }) => (
              <FormItem>
                <FormLabel>Versículo</FormLabel>
                <FormControl><Input type="number" placeholder="Nº do versículo" {...field} /></FormControl>
              </FormItem>
            )}/>
          </div>
        );
      case "thematic":
        return (
          <FormField control={form.control} name="theme" render={({ field }) => (
            <FormItem>
              <FormLabel>Tema da Série</FormLabel>
              <FormControl><Input placeholder="Ex: Amor, Perdão, Fé..." {...field} /></FormControl>
              <FormDescription>A IA irá gerar o primeiro post de uma série sobre este tema.</FormDescription>
            </FormItem>
          )}/>
        );
      case "summary":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="book" render={({ field }) => (
              <FormItem>
                <FormLabel>Livro</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o livro" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {bibleMetadata.map(b => <SelectItem key={b.book} value={b.book}>{getTranslatedBookName(b.book, lang)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            <FormField control={form.control} name="chapter" render={({ field }) => (
              <FormItem>
                <FormLabel>Capítulo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedBook}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o capítulo" /></SelectTrigger></FormControl>
                  <SelectContent>{chapters.map(c => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )}/>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Conteúdo com IA</CardTitle>
        <CardDescription>Escolha o tipo de post que deseja criar e preencha as informações.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>1. Escolha o tipo de conteúdo</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><RadioGroupItem value="devotional" /></FormControl>
                      <FormLabel className="font-normal">Post Devocional (baseado em um versículo)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><RadioGroupItem value="thematic" /></FormControl>
                      <FormLabel className="font-normal">Série Temática (baseado em um tema)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl><RadioGroupItem value="summary" /></FormControl>
                      <FormLabel className="font-normal">Resumo de Capítulo</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}/>

            <div className="space-y-2">
                <FormLabel>2. Forneça o contexto</FormLabel>
                {renderConditionalFields()}
            </div>
            
            <FormMessage>{form.formState.errors.type?.message}</FormMessage>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : "Gerar Conteúdo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}