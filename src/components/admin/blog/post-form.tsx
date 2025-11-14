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
import { NewPostData, createPost, updatePost, EditablePostData } from '@/app/actions/blog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './image-upload';
import { useBlogCategories } from '@/hooks/use-blog-categories';
import { Checkbox } from '@/components/ui/checkbox';
import { TranslationDialog } from './translation-dialog';
import { AIResponse } from '@/app/actions/ai';

// Tipo unificado para dados iniciais (AIResponse é um subconjunto de EditablePostData)
// Usamos Partial<EditablePostData> para cobrir todos os campos do DB, e & Partial<AIResponse>
// para garantir que os campos da IA (que podem ser mais restritivos) sejam aceitos.
// O problema é que o TS está vendo a união de tipos de 'summary' e 'seo_title' como incompatível.
// Vamos usar um tipo utilitário para garantir que todos os campos de string sejam string | null | undefined.
type NullableStringFields<T> = {
    [K in keyof T]: T[K] extends string | null ? string | null | undefined : T[K];
};

type InitialPostData = NullableStringFields<EditablePostData> & Partial<AIResponse>;


interface PostFormProps {
  lang: Locale;
  // Permitindo InitialPostData ou null
  initialData?: InitialPostData | null;
  isEditing?: boolean;
  postId?: string; // Necessário apenas no modo de edição
}

// --- Schema de Validação ---
const postSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }).max(100),
  slug: z.string().min(5, { message: "O slug deve ter pelo menos 5 caracteres." }).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug deve ser em minúsculas e usar hífens."),
  content: z.string().min(50, { message: "O conteúdo deve ter pelo menos 50 caracteres." }),
  summary: z.string().max(300, { message: "O resumo deve ter no máximo 300 caracteres." }).nullable().optional(), // Permitindo null
  image_url: z.string().url({ message: "URL de imagem inválida." }).nullable().optional(), // Permitindo null
  
  // SEO
  seo_title: z.string().max(70, { message: "Máximo de 70 caracteres." }).nullable().optional(),
  seo_description: z.string().max(160, { message: "Máximo de 160 caracteres." }).nullable().optional(),

  // Status e Datas
  status: z.enum(['draft', 'published', 'archived']),
  published_at: z.string().datetime({ offset: true }).nullable().optional(),
  scheduled_for: z.string().datetime({ offset: true }).nullable().optional(),
  category_ids: z.array(z.string()).optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

// --- Textos I18n ---
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
  },
};

export function PostForm({ lang, initialData, isEditing = false, postId }: PostFormProps) {
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
    category_ids: (initialData as EditablePostData)?.category_ids || [],
  };

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues,
  });

  const titleValue = form.watch('title');
  const imageUrl = form.watch('image_url');

  // --- Geração automática de slug ---
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
  // --- Fim da geração automática de slug ---

  const handleImageUploadSuccess = (url: string) => {
    form.setValue('image_url', url, { shouldValidate: true });
  };

  const handleImageRemove = () => {
    form.setValue('image_url', null, { shouldValidate: true });
  };

  async function onSubmit(values: PostFormValues) {
    startTransition(async () => {
      const postData: NewPostData = {
        ...values,
        summary: values.summary || null,
        image_url: values.image_url || null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        published_at: values.published_at || null,
        scheduled_for: values.scheduled_for || null,
        category_ids: values.category_ids || [],
      };

      const result = isEditing && postId 
        ? await updatePost(postId, postData, lang)
        : await createPost(postData, lang);

      if (result.success) {
        toast.success(isEditing ? t.successEdit : t.successCreate);
        
        // Corrigindo erros 1 e 2: Usando type assertion para garantir que o resultado
        // contenha as propriedades de CreatePostSuccess quando !isEditing for true.
        if (!isEditing && 'postId' in result && 'postContent' in result) {
          const creationResult = result as { postId: string, postContent: { title: string, summary: string | null, content: string } };
          
          // Modo Criação: Abre o diálogo de tradução
          setNewPostData({
            postId: creationResult.postId,
            postContent: creationResult.postContent,
          });
          setIsTranslationDialogOpen(true);
        } else if (isEditing) {
          // Modo Edição: Redireciona para a lista
          router.push(`/${lang}/admin/blog`);
        }
        
      } else {
        toast.error(result.message || t.error);
      }
    });
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coluna Principal (Conteúdo) */}
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

            {/* Coluna Lateral (Metadados) */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.image}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload 
                    lang={lang} 
                    onUploadSuccess={handleImageUploadSuccess} 
                    initialImageUrl={imageUrl}
                    onRemove={handleImageRemove}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.statusLabel}</CardTitle>
                </CardHeader>
                <CardContent>
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