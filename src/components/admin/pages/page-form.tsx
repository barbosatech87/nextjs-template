"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { PageData, createPage, updatePage } from '@/app/actions/pages';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Page } from '@/types/supabase';
import { PageTranslationDialog } from './page-translation-dialog';

const pageSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug deve ser em minúsculas e usar hífens."),
  summary: z.string().optional(),
  content: z.string().min(10, { message: "O conteúdo é obrigatório." }),
  status: z.enum(['draft', 'published']),
});

type PageFormValues = z.infer<typeof pageSchema>;

interface PageFormProps {
  lang: Locale;
  initialData?: Page | null;
  isEditing?: boolean;
  pageId?: string;
}

const texts = {
  pt: {
    save: "Criar Página",
    saving: "Criando...",
    saveEdit: "Salvar Alterações",
    savingEdit: "Salvando...",
    successCreate: "Página criada com sucesso!",
    successEdit: "Página atualizada com sucesso!",
    error: "Ocorreu um erro.",
    title: "Título",
    slug: "Slug (URL)",
    slugHelp: "Será gerado automaticamente a partir do título.",
    summary: "Resumo",
    content: "Conteúdo (Markdown)",
    status: "Status",
    draft: "Rascunho",
    published: "Publicado",
  },
};

export function PageForm({ lang, initialData, isEditing = false, pageId }: PageFormProps) {
  const t = texts.pt;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!initialData?.slug);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const [newPageData, setNewPageData] = useState<{ pageId: string, pageContent: { title: string, summary: string | null, content: string } } | null>(null);

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      summary: initialData?.summary || '',
      content: initialData?.content || '',
      status: initialData?.status || 'draft',
    },
  });

  const titleValue = form.watch('title');

  const generateSlug = (text: string) => {
    if (!text) return '';
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
  };

  useEffect(() => {
    if (!isSlugManuallyEdited && titleValue) {
      form.setValue('slug', generateSlug(titleValue), { shouldValidate: true });
    }
  }, [titleValue, isSlugManuallyEdited, form]);

  async function onSubmit(values: PageFormValues) {
    startTransition(async () => {
      const pageData: PageData = values;
      const result = isEditing && pageId
        ? await updatePage(pageId, pageData, lang)
        : await createPage(pageData, lang);

      if (result.success) {
        toast.success(isEditing ? t.successEdit : t.successCreate);
        
        const id = isEditing ? pageId! : (result as { pageId: string }).pageId;
        setNewPageData({
          pageId: id,
          pageContent: {
            title: values.title,
            summary: values.summary || null,
            content: values.content,
          },
        });
        setIsTranslationDialogOpen(true);
      } else {
        toast.error(result.message || t.error);
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? t.saveEdit : t.save}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.title}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.slug}</FormLabel>
                  <FormControl><Input {...field} onChange={(e) => { setIsSlugManuallyEdited(true); field.onChange(e); }} /></FormControl>
                  <FormDescription>{t.slugHelp}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="summary" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.summary}</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.content}</FormLabel>
                  <FormControl><Textarea rows={15} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.status}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t.draft}</SelectItem>
                      <SelectItem value="published">{t.published}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditing ? (isPending ? t.savingEdit : t.saveEdit) : (isPending ? t.saving : t.save)}
            </Button>
          </div>
        </form>
      </Form>
      {newPageData && (
        <PageTranslationDialog
          lang={lang}
          pageId={newPageData.pageId}
          pageContent={newPageData.pageContent}
          isOpen={isTranslationDialogOpen}
          onClose={() => setIsTranslationDialogOpen(false)}
        />
      )}
    </>
  );
}