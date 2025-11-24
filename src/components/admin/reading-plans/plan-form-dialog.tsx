"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, X, Library } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { getBibleMetadata } from '@/app/actions/ai';
import { savePredefinedPlan, PredefinedPlan } from '@/app/actions/reading-plans';
import { predefinedPlanSchema, PredefinedPlanFormData } from '@/lib/schemas/reading-plans';
import { getTranslatedBookName } from '@/lib/bible-translations';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const CANONICAL_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "I Samuel", "II Samuel", "I Kings", "II Kings", "I Chronicles", "II Chronicles", "Ezra", "Nehemiah", "Esther",
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "I Corinthians", "II Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "I Thessalonians", "II Thessalonians", "I Timothy", "II Timothy", "Titus", "Philemon", "Hebrews", "James",
  "I Peter", "II Peter", "I John", "II John", "III John", "Jude", "Revelation of John"
];

interface BibleMeta { book: string; total_chapters: number; }

interface PlanFormDialogProps {
  lang: Locale;
  initialData?: PredefinedPlan;
  children: React.ReactNode;
}

export function PlanFormDialog({ lang, initialData, children }: PlanFormDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [bibleMetadata, setBibleMetadata] = useState<BibleMeta[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<PredefinedPlanFormData>({
    resolver: zodResolver(predefinedPlanSchema),
    defaultValues: {
      name: "", description: "", books: [], duration: 30, is_public: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      getBibleMetadata(lang).then(setBibleMetadata);
      if (initialData) {
        form.reset({
          id: initialData.id,
          name: initialData.name,
          description: initialData.description || "",
          books: initialData.books,
          duration: initialData.duration_days,
          is_public: initialData.is_public,
        });
        setSelectedBooks(initialData.books);
      } else {
        form.reset({
          name: "", description: "", books: [], duration: 30, is_public: true,
        });
        setSelectedBooks([]);
      }
    }
  }, [isOpen, initialData, form, lang]);

  const onSubmit = async (values: PredefinedPlanFormData) => {
    setIsPending(true);
    const result = await savePredefinedPlan(values, lang);
    if (result.success) {
      toast.success(result.message);
      setIsOpen(false);
    } else {
      toast.error(result.message);
    }
    setIsPending(false);
  };

  const handleBookSelect = (bookName: string) => {
    const newSelectedBooks = selectedBooks.includes(bookName)
      ? selectedBooks.filter(b => b !== bookName)
      : [...selectedBooks, bookName];
    setSelectedBooks(newSelectedBooks);
    form.setValue("books", newSelectedBooks, { shouldValidate: true });
  };

  const handleSelectAll = () => {
    const allBooksAvailable = CANONICAL_ORDER.filter(canonical => bibleMetadata.some(meta => meta.book === canonical));
    if (selectedBooks.length === allBooksAvailable.length) {
      setSelectedBooks([]);
      form.setValue("books", [], { shouldValidate: true });
    } else {
      setSelectedBooks(allBooksAvailable);
      form.setValue("books", allBooksAvailable, { shouldValidate: true });
    }
    setPopoverOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Plano' : 'Novo Plano de Leitura'}</DialogTitle>
          <DialogDescription>Preencha os detalhes do plano pré-definido.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome do Plano</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="books" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Livros</FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>
                        {field.value?.length ? `${field.value.length} livros selecionados` : "Selecione os livros..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar livro..." />
                      <CommandList>
                        <CommandEmpty>Nenhum livro encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all_books_option" onSelect={handleSelectAll} className="font-medium text-primary">
                            <Library className="mr-2 h-4 w-4" /> Bíblia Completa
                          </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                          {bibleMetadata.map((book) => (
                            <CommandItem key={book.book} value={getTranslatedBookName(book.book, lang)} onSelect={() => handleBookSelect(book.book)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedBooks.includes(book.book) ? "opacity-100" : "opacity-0")} />
                              {getTranslatedBookName(book.book, lang)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedBooks.map(book => (
                    <Badge key={book} variant="secondary">{getTranslatedBookName(book, lang)}</Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem><FormLabel>Duração (dias)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="is_public" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><FormLabel>Público</FormLabel><FormMessage /></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
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