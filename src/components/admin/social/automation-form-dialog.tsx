"use client";

import React, { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { saveSocialAutomation, SocialAutomation } from '@/app/actions/social';
import { Locale } from '@/lib/i18n/config';
import { useBlogCategories, BlogCategory } from '@/hooks/use-blog-categories';
import { socialAutomationSchema, SocialAutomationFormData } from '@/lib/schemas/social';

function parseCronExpression(cron: string): Partial<SocialAutomationFormData> {
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
  initialData?: SocialAutomation;
  children: React.ReactNode;
}

export function AutomationFormDialog({ lang, initialData, children }: AutomationFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useBlogCategories();
  const isEditing = !!initialData;

  const form = useForm<SocialAutomationFormData>({
    resolver: zodResolver(socialAutomationSchema),
    defaultValues: {
      name: '', platform: 'pinterest', is_active: true, source_category_id: null,
      pinterest_board_id: '', image_prompt_template: '', description_template: '',
      frequencyType: 'daily', time: '09:00', dayOfWeek: '1', dayOfMonth: '1',
      frequency_cron_expression: '0 9 * * *',
    },
  });

  const platform = form.watch('platform');
  const frequencyType = form.watch('frequencyType');

  useEffect(() => {
    if (isOpen) {
      let defaultVals: Partial<SocialAutomationFormData> = {
        name: '', platform: 'pinterest', is_active: true, source_category_id: null,
        pinterest_board_id: '', image_prompt_template: 'Imagem de um {post_title}', 
        description_template: 'Leia mais sobre {post_title} em nosso blog! #versiculo #devocional',
        frequencyType: 'daily', time: '09:00', dayOfWeek: '1', dayOfMonth: '1',
        frequency_cron_expression: '0 9 * * *',
      };
      if (initialData) {
        const parsedCron = parseCronExpression(initialData.frequency_cron_expression);
        defaultVals = { ...initialData, ...parsedCron };
      }
      form.reset(defaultVals as SocialAutomationFormData);
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: SocialAutomationFormData) => {
    startTransition(async () => {
      const result = await saveSocialAutomation(values, lang);
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
          <DialogTitle>{isEditing ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
          <DialogDescription>Configure os detalhes para a postagem automática.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Pins de Devocionais" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="platform" render={({ field }) => (
              <FormItem><FormLabel>Plataforma</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pinterest">Pinterest</SelectItem><SelectItem value="facebook" disabled>Facebook (em breve)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            {platform === 'pinterest' && (
              <FormField control={form.control} name="pinterest_board_id" render={({ field }) => (
                <FormItem><FormLabel>ID do Board do Pinterest</FormLabel><FormControl><Input placeholder="123456789012345678" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <FormField control={form.control} name="source_category_id" render={({ field }) => (
              <FormItem><FormLabel>Categoria de Origem (Opcional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value ?? ''}><FormControl><SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><FormDescription>Postar apenas artigos desta categoria.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="image_prompt_template" render={({ field }) => (
              <FormItem><FormLabel>Template do Prompt da Imagem</FormLabel><FormControl><Textarea placeholder="Ex: Imagem sobre {post_title}" {...field} /></FormControl><FormDescription>Variáveis: {"{post_title}"}, {"{post_summary}"}</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description_template" render={({ field }) => (
              <FormItem><FormLabel>Template da Descrição</FormLabel><FormControl><Textarea placeholder="Ex: Leia mais sobre {post_title} no blog!" {...field} /></FormControl><FormDescription>Variáveis: {"{post_title}"}, {"{post_summary}"}</FormDescription><FormMessage /></FormItem>
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
                <FormItem><FormLabel>Expressão Cron</FormLabel><FormControl><Input placeholder="0 9 * * *" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
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