"use client";

import React, { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { saveStoryAutomation, StoryAutomation } from '@/app/actions/stories';
import { Locale } from '@/lib/i18n/config';
import { storyAutomationSchema, StoryAutomationFormData } from '@/lib/schemas/stories';
import { useBlogCategories } from '@/hooks/use-blog-categories';

function parseCronExpression(cron: string): Partial<StoryAutomationFormData> {
  const parts = cron.split(' ');
  if (parts.length !== 5) return { frequencyType: 'custom', frequency_cron_expression: cron };
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  if (dayOfWeek !== '*' && dayOfWeek !== '?') return { frequencyType: 'weekly', time, dayOfWeek };
  if (dayOfMonth !== '*') return { frequencyType: 'monthly', time, dayOfMonth };
  return { frequencyType: 'daily', time };
}

interface AutomationFormDialogProps {
  lang: Locale;
  initialData?: StoryAutomation;
  children: React.ReactNode;
}

export function AutomationFormDialog({ lang, initialData, children }: AutomationFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useBlogCategories();
  const isEditing = !!initialData;

  const form = useForm<StoryAutomationFormData>({
    resolver: zodResolver(storyAutomationSchema),
    defaultValues: {
      name: '', is_active: true,
      source_category_id: null,
      number_of_pages: 5,
      add_post_link_on_last_page: true,
      publish_automatically: false,
      frequencyType: 'daily', time: '10:00', dayOfWeek: '1', dayOfMonth: '1',
      frequency_cron_expression: '0 10 * * *',
    },
  });

  const frequencyType = form.watch('frequencyType');

  useEffect(() => {
    if (isOpen) {
      let defaultVals: Partial<StoryAutomationFormData> = {
        name: '', is_active: true,
        source_category_id: null,
        number_of_pages: 5,
        add_post_link_on_last_page: true,
        publish_automatically: false,
        frequencyType: 'daily', time: '10:00', dayOfWeek: '1', dayOfMonth: '1',
        frequency_cron_expression: '0 10 * * *',
      };
      if (initialData) {
        const parsedCron = parseCronExpression(initialData.frequency_cron_expression);
        // @ts-ignore
        defaultVals = { ...initialData, ...parsedCron };
      }
      form.reset(defaultVals as StoryAutomationFormData);
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: StoryAutomationFormData) => {
    startTransition(async () => {
      const result = await saveStoryAutomation(values, lang);
      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Automação' : 'Nova Automação de Story'}</DialogTitle>
          <DialogDescription>Configure a geração automática de Web Stories a partir de posts do blog.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Stories de Devocionais" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="source_category_id" render={({ field }) => (
              <FormItem><FormLabel>Categoria de Origem</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><FormDescription>A automação usará posts desta categoria.</FormDescription><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="number_of_pages" render={({ field }) => (
              <FormItem><FormLabel>Número de Páginas</FormLabel><FormControl><Input type="number" min="3" max="15" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="frequencyType" render={({ field }) => (
              <FormItem><FormLabel>Frequência</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="daily">Diário</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="custom">Personalizado (Cron)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            {frequencyType !== 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="time" render={({ field }) => (
                  <FormItem><FormLabel>Horário (UTC)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {frequencyType === 'weekly' && (
                  <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                    <FormItem><FormLabel>Dia da Semana</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Segunda</SelectItem><SelectItem value="2">Terça</SelectItem><SelectItem value="3">Quarta</SelectItem><SelectItem value="4">Quinta</SelectItem><SelectItem value="5">Sexta</SelectItem><SelectItem value="6">Sábado</SelectItem><SelectItem value="0">Domingo</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                )}
                {frequencyType === 'monthly' && (
                  <FormField control={form.control} name="dayOfMonth" render={({ field }) => (
                    <FormItem><FormLabel>Dia do Mês</FormLabel><FormControl><Input type="number" min="1" max="31" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
              </div>
            )}
            {frequencyType === 'custom' && (
              <FormField control={form.control} name="frequency_cron_expression" render={({ field }) => (
                <FormItem><FormLabel>Expressão Cron</FormLabel><FormControl><Input placeholder="0 10 * * *" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            )}

            <FormField control={form.control} name="add_post_link_on_last_page" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Adicionar Link do Post</FormLabel><FormDescription>Inclui um link para o post original na última página.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="publish_automatically" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Publicar Automaticamente</FormLabel><FormDescription>Publica a story e dispara as traduções.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )} />
            
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}