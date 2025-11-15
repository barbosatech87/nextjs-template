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
import { saveSchedule, Schedule } from '@/app/actions/schedules';
import { Author } from '@/app/actions/users';
import { Locale } from '@/lib/i18n/config';
import { BlogCategory, getBlogCategories } from '@/app/actions/blog';
import { Checkbox } from '@/components/ui/checkbox';
import { scheduleSchema, ScheduleFormData } from '@/lib/schemas/schedules';

// Função para analisar a expressão cron e preencher o formulário
function parseCronExpression(cron: string): Partial<ScheduleFormData> {
  const parts = cron.split(' ');
  if (parts.length !== 5) return { frequencyType: 'custom', frequency_cron_expression: cron };

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  if (dayOfWeek !== '*' && dayOfWeek !== '?') {
    return { frequencyType: 'weekly', time, dayOfWeek };
  }
  if (dayOfMonth !== '*') {
    return { frequencyType: 'monthly', time, dayOfMonth };
  }
  if (dayOfMonth === '*' && dayOfWeek === '*') {
    return { frequencyType: 'daily', time };
  }
  return { frequencyType: 'custom', frequency_cron_expression: cron };
}

interface ScheduleFormDialogProps {
  lang: Locale;
  authors: Author[];
  initialData?: Schedule;
  children: React.ReactNode;
}

export function ScheduleFormDialog({ lang, authors, initialData, children }: ScheduleFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const isEditing = !!initialData;

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      post_type: 'devotional',
      theme: '',
      default_image_prompt: '',
      is_active: true,
      author_id: undefined,
      category_ids: [],
      frequencyType: 'daily',
      time: '05:00',
      dayOfWeek: '1',
      dayOfMonth: '1',
      frequency_cron_expression: '0 5 * * *',
    },
  });

  const postType = form.watch('post_type');
  const frequencyType = form.watch('frequencyType');

  useEffect(() => {
    if (isOpen) {
      let defaultVals: Partial<ScheduleFormData> = {
        name: '', post_type: 'devotional', theme: '', default_image_prompt: '',
        is_active: true, author_id: undefined, category_ids: [],
        frequencyType: 'daily', time: '05:00', dayOfWeek: '1', dayOfMonth: '1',
        frequency_cron_expression: '0 5 * * *',
      };

      if (initialData) {
        const parsedCron = parseCronExpression(initialData.frequency_cron_expression || '0 5 * * *');
        defaultVals = { ...initialData, ...parsedCron };
      }
      
      form.reset(defaultVals as ScheduleFormData);
      getBlogCategories().then(setCategories);
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: ScheduleFormData) => {
    startTransition(async () => {
      const result = await saveSchedule(values, lang);
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
          <DialogTitle>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>Configure os detalhes para a geração automática de posts.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Devocional Diário" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="post_type" render={({ field }) => (
              <FormItem><FormLabel>Tipo de Post</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="devotional">Devocional (Versículo Aleatório)</SelectItem><SelectItem value="thematic">Estudo Temático</SelectItem><SelectItem value="summary" disabled>Resumo de Capítulo (Em breve)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />

            {postType === 'thematic' && (
              <FormField control={form.control} name="theme" render={({ field }) => (
                <FormItem><FormLabel>Tema do Estudo</FormLabel><FormControl><Input placeholder="Ex: Fé, Esperança, Amor" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            )}

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
                    <FormItem><FormLabel>Dia da Semana</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="1">Segunda-feira</SelectItem><SelectItem value="2">Terça-feira</SelectItem><SelectItem value="3">Quarta-feira</SelectItem><SelectItem value="4">Quinta-feira</SelectItem><SelectItem value="5">Sexta-feira</SelectItem><SelectItem value="6">Sábado</SelectItem><SelectItem value="0">Domingo</SelectItem></SelectContent></Select><FormMessage /></FormItem>
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
                <FormItem><FormLabel>Expressão Cron</FormLabel><FormControl><Input placeholder="0 5 * * *" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Ex: '0 5 * * *' para todo dia às 5h UTC.</FormDescription><FormMessage /></FormItem>
              )} />
            )}
            
            <FormField control={form.control} name="author_id" render={({ field }) => (
              <FormItem><FormLabel>Autor Padrão</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um autor" /></SelectTrigger></FormControl><SelectContent>{authors.map(author => (<SelectItem key={author.id} value={author.id}>{author.full_name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="category_ids" render={() => (
              <FormItem><FormLabel>Categorias</FormLabel><div className="space-y-2">{categories.map((category) => (<FormField key={category.id} control={form.control} name="category_ids" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(category.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), category.id]) : field.onChange(field.value?.filter((value: string) => value !== category.id)); }} /></FormControl><FormLabel className="font-normal">{category.name}</FormLabel></FormItem>)} />))}</div><FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="default_image_prompt" render={({ field }) => (
              <FormItem><FormLabel>Prompt Padrão da Imagem</FormLabel><FormControl><Textarea placeholder="Um leão majestoso em um campo florido..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Ativo</FormLabel><FormDescription>Se ativo, este agendamento será executado.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
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