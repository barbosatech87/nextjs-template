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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { Locale } from '@/lib/i18n/config';
import { NewPostData, createPost, updatePost } from '@/app/actions/blog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './image-upload';
import { useBlogCategories } from '@/hooks/use-blog-categories';
import { Checkbox } from '@/components/ui/checkbox';
import { TranslationDialog } from './translation-dialog';
import { GeneratedImageData } from '@/app/actions/image-generation';

const postSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }).max(100),
  slug: z.string().min(5, { message: "O slug deve ter pelo menos 5 caracteres." }).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug deve ser em minúsculas e usar hífens."),
  content: z.string().min(50, { message: "O conteúdo deve ter pelo menos 50 caracteres." }),
  summary: z.string().min(10, { message: "O resumo deve ter pelo menos 10 caracteres para ser usado na geração de imagem." }).max(300, { message: "O resumo deve ter no máximo 300 caracteres." }).nullable().optional(),
  image_url: z.string().url({ message: "URL de imagem inválida." }).nullable().optional(),
  seo_title: z.string().max(70, { message: "Máximo de 70 caracteres." }).nullable().optional(),
  seo_description: z.string().max(160, { message: "Máximo de 160 caracteres." }).nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  published_at: z.string().datetime({ offset: true }).nullable().optional(),
  scheduled_for: z.string().datetime({ offset: true }).nullable().optional(),
  category_ids: z.array(z.string()).optional(),
  // Campo de UI para data/hora (datetime-local), usado para decidir published_at ou scheduled_for
  scheduleDate: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;
type InitialPostData = Partial<PostFormValues>;

interface PostFormProps {
  lang: Locale;
  initialData?: InitialPostData | null;
  isEditing?: boolean;
  postId?: string;
  initialImages: GeneratedImageData[];
}

const texts = {
  pt: {
    titleCreate: "Criar Nova Postagem",
    titleEdit: "Editar Postagem",
    general: "Informações Gerais",
    seo: "Otimização para Buscadores (SEO)",
    image: "Imagem de Capa",
    titleLabel: "Título",
    slugLabel: "Slug (URL)",
    contentLabel: "Conteúdo (Markdown/HTML)",
    summaryLabel: "Resumo",
    statusLabel: "Status",
    categoryLabel: "Categorias",
    seoTitleLabel: "Título SEO",
    seoDescriptionLabel: "Descrição SEO",
    save: "Criar Postagem",
    saving: "Criando...",
    successCreate: "Postagem criada com sucesso!",
    successEdit: "Postagem atualizada com sucesso!",
    error: "Erro ao salvar postagem. Verifique os campos.",
    draft: "Rascunho",
    published: "Publicado",
    archived: "Arquivado",
    slugHelp: "Usado na URL. Ex: 'meu-primeiro-post'",
    categoryHelp: "Selecione as categorias relevantes.",
    saveEdit: "Salvar Alterações",
    savingEdit: "Salvando...",
    coverSet: "Imagem definida como capa.",
    scheduleLabel: "Data/Hora de publicação ou agendamento",
    scheduleHelp: "Se vazio, usaremos a data/hora atual. Se for no futuro, o post será agendado.",
  },
  en: {
    titleCreate: "Create New Post",
    titleEdit: "Edit Post",
    general: "General Information",
    seo: "Search Engine Optimization (SEO)",
    image: "Cover Image",
    titleLabel: "Title",
    slugLabel: "Slug (URL)",
    contentLabel: "Content (Markdown/HTML)",
    summaryLabel: "Summary",
    statusLabel: "Status",
    categoryLabel: "Categories",
    seoTitleLabel: "SEO Title",
    seoDescriptionLabel: "SEO Description",
    save: "Create Post",
    saving: "Creating...",
    successCreate: "Post created successfully!",
    successEdit: "Post updated successfully!",
    error: "Error saving post. Please check the fields.",
    draft: "Draft",
    published: "Published",
    archived: "Archived",
    slugHelp: "Used in the URL. Ex: 'my-first-post'",
    categoryHelp: "Select relevant categories.",
    saveEdit: "Save Changes",
    savingEdit: "Saving...",
    coverSet: "Cover image set.",
    scheduleLabel: "Publish/Schedule Date & Time",
    scheduleHelp: "If empty, we'll use the current date/time. If in the future, the post will be scheduled.",
  },
  es: {
    titleCreate: "Crear Nueva Entrada",
    titleEdit: "Editar Entrada",
    general: "Información General",
    seo: "Optimización para Motores de Búsqueda (SEO)",
    image: "Imagen de Portada",
    titleLabel: "Título",
    slugLabel: "Slug (URL)",
    contentLabel: "Contenido (Markdown/HTML)",
    summaryLabel: "Resumen",
    statusLabel: "Estado",
    categoryLabel: "Categorías",
    seoTitleLabel: "Título SEO",
    seoDescriptionLabel: "Descripción SEO",
    save: "Crear Entrada",
    saving: "Creando...",
    successCreate: "¡Entrada creada con éxito!",
    successEdit: "¡Entrada actualizada con éxito!",
    error: "Error al guardar la entrada. Verifica los campos.",
    draft: "Borrador",
    published: "Publicado",
    archived: "Archivado",
    slugHelp: "Utilizado en la URL. Ej: 'mi-primera-entrada'",
    categoryHelp: "Selecciona las categorías relevantes.",
    saveEdit: "Guardar Cambios",
    savingEdit: "Guardando...",
    coverSet: "Imagen de portada establecida.",
    scheduleLabel: "Fecha/Hora de publicación o programación",
    scheduleHelp: "Si está vacío, usaremos la fecha/hora actual. Si es en el futuro, se programará la publicación.",
  },
};

function isoToLocalInput(isoString: string | null | undefined) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function PostForm({ lang, initialData, isEditing = false, postId, initialImages }: PostFormProps) {
  const t = texts[lang] || texts.pt;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { categories, isLoading: isLoadingCategories } = useBlogCategories();
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const [newPostData, setNewPostData] = useState<{ postId: string, postContent: { title: string, summary: string | null, content: string } } | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!initialData?.slug);

  const defaultValues: PostFormValues = {
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    summary: initialData?.summary || null,
    image_url: initialData?.image_url || null,
    seo_title: initialData?.seo_title || null,
    seo_description: initialData?.seo_description || null,
    status: initialData?.status || 'draft',
    published_at: initialData?.published_at || null,
    scheduled_for: initialData?.scheduled_for || null,
    category_ids: initialData?.category_ids || [],
    // Prefere mostrar o agendamento, senão a data de publicação existente
    scheduleDate: isoToLocalInput(initialData?.scheduled_for ?? initialData?.published_at ?? null),
  };

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues,
  });

  // Estado local para refletir imediatamente na UI do ImageUpload
  const [coverUrl, setCoverUrl] = useState<string | null>(defaultValues.image_url ?? null);

  // Garante registro do campo image_url
  useEffect(() => {
    form.register('image_url');
  }, [form]);

  const titleValue = form.watch('title');
  const summaryValue = form.watch('summary');
  const safeSummaryValue: string | null = summaryValue ?? null;

  const generateSlug = (text: string) => {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  useEffect(() => {
    if (!isSlugManuallyEdited && titleValue) {
      const slug = generateSlug(titleValue);
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [titleValue, isSlugManuallyEdited, form]);

  const handleImageUploadSuccess = (url: string) => {
    setCoverUrl(url);
    form.setValue('image_url', url, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    toast.success(t.coverSet);
  };

  const handleImageRemove = () => {
    setCoverUrl(null);
    form.setValue('image_url', null, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  function toISOFromLocal(localString: string): string {
    // localString no formato "YYYY-MM-DDTHH:mm"
    const date = new Date(localString);
    return date.toISOString();
    // Mantém o offset como 'Z' (UTC), compatível com schema (offset: true)
  }

  async function onSubmit(values: PostFormValues) {
    startTransition(async () => {
      // Decide published_at ou scheduled_for, e default se vazio
      const hasSchedule = !!values.scheduleDate && values.scheduleDate.trim() !== '';
      let publishedISO: string | null = null;
      let scheduledISO: string | null = null;

      if (hasSchedule) {
        const chosen = new Date(values.scheduleDate as string);
        const now = new Date();
        if (chosen.getTime() > now.getTime()) {
          scheduledISO = toISOFromLocal(values.scheduleDate as string);
        } else {
          publishedISO = toISOFromLocal(values.scheduleDate as string);
        }
      } else {
        publishedISO = new Date().toISOString();
      }

      const postData: NewPostData = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        summary: values.summary || null,
        image_url: values.image_url || null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        status: values.status,
        published_at: publishedISO,
        scheduled_for: scheduledISO,
        category_ids: values.category_ids || [],
      };

      const result = isEditing && postId 
        ? await updatePost(postId, postData, lang)
        : await createPost(postData, lang);

      if (result.success) {
        toast.success(isEditing ? t.successEdit : t.successCreate);
        
        if (!isEditing && 'postId' in result && 'postContent' in result) {
          const creationResult = result as { postId: string, postContent: { title: string, summary: string | null, content: string } };
          setNewPostData({
            postId: creationResult.postId,
            postContent: creationResult.postContent,
          });
          setIsTranslationDialogOpen(true);
        } else if (isEditing) {
          router.push(`/${lang}/admin/blog`);
        }
      } else {
        toast.error((result as { message?: string }).message || t.error);
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.general}</CardTitle>
                  <CardDescription>Informações essenciais da postagem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.titleLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder="Título da Postagem" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.slugLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="slug-da-postagem" 
                            {...field}
                            onChange={(e) => {
                              if (!isSlugManuallyEdited) {
                                setIsSlugManuallyEdited(true);
                              }
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormDescription>{t.slugHelp}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.summaryLabel}</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Um breve resumo do conteúdo..." rows={3} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contentLabel}</FormLabel>
                        <FormControl>
                          <Textarea placeholder="O conteúdo completo da postagem..." rows={15} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.seo}</CardTitle>
                  <CardDescription>Melhore a visibilidade nos motores de busca.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.seoTitleLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder="Título para SEO" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.seoDescriptionLabel}</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição para SEO" rows={3} {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.image}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload 
                    lang={lang} 
                    onUploadSuccess={handleImageUploadSuccess} 
                    initialImageUrl={coverUrl}
                    onRemove={handleImageRemove}
                    postSummary={safeSummaryValue}
                    initialImages={initialImages}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.statusLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">{t.statusLabel}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.statusLabel} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">{t.draft}</SelectItem>
                            <SelectItem value="published">{t.published}</SelectItem>
                            <SelectItem value="archived">{t.archived}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.scheduleLabel}</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>{t.scheduleHelp}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.categoryLabel}</CardTitle>
                  <CardDescription>{t.categoryHelp}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingCategories ? (
                    <p>Carregando categorias...</p>
                  ) : (
                    <FormField
                      control={form.control}
                      name="category_ids"
                      render={() => (
                        <FormItem>
                          {categories.map((category) => (
                            <FormField
                              key={category.id}
                              control={form.control}
                              name="category_ids"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={category.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(category.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), category.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== category.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {category.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? t.savingEdit : t.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? t.saveEdit : t.save}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {newPostData && (
        <TranslationDialog
          lang={lang}
          postId={newPostData.postId}
          postContent={newPostData.postContent}
          isOpen={isTranslationDialogOpen}
          onClose={() => setIsTranslationDialogOpen(false)}
        />
      )}
    </>
  );
}