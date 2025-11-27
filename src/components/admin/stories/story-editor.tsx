"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Save, ArrowLeft, ArrowRight, 
  Type, Image as ImageIcon, Layers, Settings, Eye, Link as LinkIcon, ArrowUp 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { Locale } from '@/lib/i18n/config';
import { createStory, updateStory } from '@/app/actions/stories';
import { WebStory } from '@/types/supabase';
import { StoryTranslationDialog } from './story-translation-dialog';

// --- Tipos do Editor ---

type StoryElement = {
  id: string;
  type: 'text' | 'image';
  content?: string; // Para texto
  src?: string; // Para imagem
  style: React.CSSProperties;
};

type StoryPage = {
  id: string;
  backgroundSrc: string;
  backgroundType: 'image' | 'video';
  elements: StoryElement[];
  outlink?: {
    href: string;
    ctaText: string;
  };
};

// Schema de validação para metadados
const storyMetaSchema = z.object({
  title: z.string().min(5, "Título muito curto"),
  slug: z.string().min(5, "Slug muito curto").regex(/^[a-z0-9-]+$/, "Slug inválido (use apenas letras minúsculas e hífens)"),
  poster_image_src: z.string().url("URL da capa inválida"),
  status: z.enum(['draft', 'published', 'archived']),
});

type StoryMetaValues = z.infer<typeof storyMetaSchema>;

interface StoryEditorProps {
  lang: Locale;
  initialData?: WebStory;
}

export function StoryEditor({ lang, initialData }: StoryEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Estado das Páginas (O JSON Core da Story)
  const [pages, setPages] = useState<StoryPage[]>(
    initialData?.story_data?.pages || [
      { id: uuidv4(), backgroundSrc: '', backgroundType: 'image', elements: [] }
    ]
  );
  
  const [activePageIndex, setActivePageIndex] = useState(0);
  const activePage = pages[activePageIndex];

  // Estado do Diálogo de Tradução
  const [translationDialog, setTranslationDialog] = useState<{ open: boolean, storyId: string, title: string, storyData: any } | null>(null);

  // Formulário de Metadados
  const form = useForm<StoryMetaValues>({
    resolver: zodResolver(storyMetaSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      poster_image_src: initialData?.poster_image_src || '',
      status: initialData?.status || 'draft',
    },
  });

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!initialData?.slug);
  const titleValue = form.watch('title');

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

  // --- Ações de Manipulação de Página ---

  const addPage = () => {
    setPages([...pages, { id: uuidv4(), backgroundSrc: '', backgroundType: 'image', elements: [] }]);
    setActivePageIndex(pages.length); // Vai para a nova página
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      toast.error("A story deve ter pelo menos uma página.");
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (activePageIndex >= newPages.length) {
      setActivePageIndex(newPages.length - 1);
    }
  };

  const updatePage = (index: number, updates: Partial<StoryPage>) => {
    const newPages = [...pages];
    newPages[index] = { ...newPages[index], ...updates };
    setPages(newPages);
  };

  // --- Ações de Elementos ---

  const addElement = (type: 'text') => {
    const newElement: StoryElement = {
      id: uuidv4(),
      type,
      content: 'Novo Texto',
      style: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px',
        textAlign: 'center',
        width: '80%',
      }
    };
    updatePage(activePageIndex, { elements: [...activePage.elements, newElement] });
  };

  const updateElement = (elementId: string, updates: Partial<StoryElement>) => {
    const newElements = activePage.elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    updatePage(activePageIndex, { elements: newElements });
  };

  const removeElement = (elementId: string) => {
    const newElements = activePage.elements.filter(el => el.id !== elementId);
    updatePage(activePageIndex, { elements: newElements });
  };

  // --- Persistência ---

  const onSubmit = (values: StoryMetaValues) => {
    if (pages.some(p => !p.backgroundSrc)) {
      toast.error("Todas as páginas precisam de uma imagem de fundo.");
      return;
    }

    startTransition(async () => {
      const storyData = { pages };
      const payload = { ...values, story_data: storyData };

      const result = initialData?.id 
        ? await updateStory(initialData.id, payload, lang)
        : await createStory(payload);

      if (result.success && result.storyId) {
        toast.success(result.message);
        // Abre diálogo de tradução
        setTranslationDialog({
          open: true,
          storyId: result.storyId,
          title: values.title,
          storyData: storyData
        });
      } else {
        toast.error(result.message);
      }
    });
  };

  // --- Renderização do Preview ---

  const renderPreview = (page: StoryPage) => (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden text-white">
      {/* Background */}
      {page.backgroundSrc ? (
        <img 
          src={page.backgroundSrc} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          Sem Imagem de Fundo
        </div>
      )}
      
      {/* Overlay Escuro Opcional (hardcoded por enquanto para legibilidade) */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Elements */}
      {page.elements.map(el => (
        <div key={el.id} style={{ position: 'absolute', ...el.style }}>
          {el.content}
        </div>
      ))}

      {/* Simulação do Link Externo */}
      {page.outlink?.href && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce z-20">
          <ArrowUp className="w-5 h-5" />
          <span className="text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
            {page.outlink.ctaText || 'Saiba Mais'}
          </span>
        </div>
      )}
    </div>
  );

  const { onChange: onSlugChange, ...slugProps } = form.register('slug');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      {/* Coluna Esquerda: Controles (3 cols) */}
      <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> Configurações</h3>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input {...form.register('title')} placeholder="Título da Story" />
              {form.formState.errors.title && <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input 
                {...slugProps}
                placeholder="slug-da-story"
                onChange={(e) => {
                  setIsSlugManuallyEdited(true);
                  onSlugChange(e);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem de Capa (Poster)</Label>
              <Input {...form.register('poster_image_src')} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                onValueChange={v => form.setValue('status', v as any)} 
                defaultValue={form.getValues('status')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending} className="w-full">
              <Save className="w-4 h-4 mr-2" /> 
              {isPending ? 'Salvando...' : 'Salvar Story'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4" /> Páginas</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {pages.map((p, idx) => (
                <div 
                  key={p.id} 
                  onClick={() => setActivePageIndex(idx)}
                  className={`p-2 border rounded cursor-pointer flex justify-between items-center ${idx === activePageIndex ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                >
                  <span className="text-sm font-medium">Página {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removePage(idx); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={addPage}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Página
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Central: Edição da Página Ativa (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto">
        <Card>
          <CardContent className="p-4 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Editando Página {activePageIndex + 1}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addElement('text')}>
                  <Type className="w-4 h-4 mr-2" /> Texto
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Fundo da Página</Label>
              <Input 
                placeholder="URL da Imagem de Fundo (https://...)" 
                value={activePage.backgroundSrc}
                onChange={(e) => updatePage(activePageIndex, { backgroundSrc: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use imagens verticais (9:16) para melhor resultado.</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Link Externo (Arrastar p/ Cima)</Label>
              <Input 
                placeholder="URL do Link (https://...)" 
                value={activePage.outlink?.href || ''}
                onChange={(e) => updatePage(activePageIndex, { outlink: { ...activePage.outlink, href: e.target.value, ctaText: activePage.outlink?.ctaText || 'Saiba Mais' } })}
              />
              <Input 
                placeholder="Texto da Chamada (Ex: Leia Mais)" 
                value={activePage.outlink?.ctaText || ''}
                onChange={(e) => updatePage(activePageIndex, { outlink: { ...activePage.outlink, ctaText: e.target.value, href: activePage.outlink?.href || '' } })}
              />
              {activePage.outlink && (
                <Button variant="link" size="sm" className="text-destructive p-0 h-auto" onClick={() => updatePage(activePageIndex, { outlink: undefined })}>
                  Remover Link
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Elementos da Página</Label>
              {activePage.elements.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum elemento adicionado.</p>}
              
              {activePage.elements.map((el, idx) => (
                <div key={el.id} className="border rounded p-3 space-y-3 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">Elemento {idx + 1} (Texto)</span>
                    <Button variant="ghost" size="sm" onClick={() => removeElement(el.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                  
                  <Textarea 
                    value={el.content} 
                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                    rows={2}
                  />
                  
                  {/* Controles de Estilo Simplificados */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cor Texto</Label>
                      <Input 
                        type="color" 
                        value={el.style.color as string} 
                        onChange={(e) => updateElement(el.id, { style: { ...el.style, color: e.target.value } })}
                        className="h-8 p-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cor Fundo</Label>
                      <Input 
                        type="text" 
                        placeholder="rgba(0,0,0,0.5)"
                        value={el.style.backgroundColor as string} 
                        onChange={(e) => updateElement(el.id, { style: { ...el.style, backgroundColor: e.target.value } })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita: Preview (4 cols) */}
      <div className="lg:col-span-4 flex flex-col items-center bg-muted/20 rounded-lg p-4 border border-dashed border-border/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Eye className="w-4 h-4" /> Preview (Mobile)</h3>
        
        {/* Simulador de Celular (Aspect Ratio 9:16) */}
        <div className="relative w-[300px] h-[533px] bg-black rounded-[2rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
          {renderPreview(activePage)}
          
          {/* Navegação Fake */}
          <div className="absolute top-0 left-0 w-full h-1 flex gap-1 px-1 pt-2 z-10">
            {pages.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full ${i === activePageIndex ? 'bg-white' : 'bg-white/30'}`} 
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={() => activePageIndex > 0 && setActivePageIndex(activePageIndex - 1)} disabled={activePageIndex === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="py-2 text-sm font-medium">
            {activePageIndex + 1} / {pages.length}
          </span>
          <Button variant="outline" onClick={() => activePageIndex < pages.length - 1 && setActivePageIndex(activePageIndex + 1)} disabled={activePageIndex === pages.length - 1}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Diálogo de Tradução */}
      {translationDialog && (
        <StoryTranslationDialog
          lang={lang}
          storyId={translationDialog.storyId}
          title={translationDialog.title}
          storyData={translationDialog.storyData}
          isOpen={translationDialog.open}
          onClose={() => setTranslationDialog(null)}
        />
      )}
    </div>
  );
}