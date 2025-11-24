"use client";

import React, { useState, useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Verse } from '@/types/supabase';
import { upsertVerseNote } from '@/app/actions/notes';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { Locale } from '@/lib/i18n/config';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface VerseNoteDialogProps {
  lang: Locale;
  verse: Verse;
  initialNote?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteSave: (verseId: string, newNote: string) => void;
}

const texts = {
  pt: {
    title: "Anotação",
    description: "Escreva sua anotação para",
    noteLabel: "Sua anotação",
    save: "Salvar",
    cancel: "Cancelar",
    saving: "Salvando...",
    saveSuccess: "Anotação salva!",
    saveError: "Erro ao salvar anotação.",
    deleteSuccess: "Anotação removida!",
  },
  en: {
    title: "Note",
    description: "Write your note for",
    noteLabel: "Your note",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    saveSuccess: "Note saved!",
    saveError: "Error saving note.",
    deleteSuccess: "Note removed!",
  },
  es: {
    title: "Anotación",
    description: "Escribe tu anotación para",
    noteLabel: "Tu anotación",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    saveSuccess: "¡Anotación guardada!",
    saveError: "Error al guardar la anotación.",
    deleteSuccess: "¡Anotación eliminada!",
  },
};

const formSchema = z.object({
  note: z.string().max(5000, "A anotação não pode exceder 5000 caracteres.").optional(),
});

export const VerseNoteDialog: React.FC<VerseNoteDialogProps> = ({
  lang,
  verse,
  initialNote = '',
  open,
  onOpenChange,
  onNoteSave,
}) => {
  const t = texts[lang] || texts.pt;
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: initialNote,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ note: initialNote });
    }
  }, [open, initialNote, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const noteContent = values.note || '';
    startTransition(async () => {
      const result = await upsertVerseNote(verse.id, noteContent);
      if (result.success) {
        toast.success(noteContent.trim() === '' ? t.deleteSuccess : t.saveSuccess);
        onNoteSave(verse.id, noteContent);
        onOpenChange(false);
      } else {
        toast.error(t.saveError);
      }
    });
  };

  const verseReference = `${getTranslatedBookName(verse.book, lang)} ${verse.chapter}:${verse.verse_number}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description} {verseReference}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">{t.noteLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.noteLabel}
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t.cancel}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? t.saving : t.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};