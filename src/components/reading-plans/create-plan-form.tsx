"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { Locale } from '@/lib/i18n/config';
import { getBibleMetadata } from '@/app/actions/ai';
import { createPlanSchema, createUserReadingPlan, CreatePlanData } from '@/app/actions/plans';
import { getTranslatedBookName } from '@/lib/bible-translations';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BibleMeta {
  book: string;
  total_chapters: number;
}

const texts = {
  pt: {
    title: "Criar Plano de Leitura Personalizado",
    description: "Escolha os livros, defina o prazo e nós montamos o plano para você.",
    form: {
      name: "Nome do Plano",
      namePlaceholder: "Ex: Lendo o Pentateuco",
      description: "Descrição (Opcional)",
      descriptionPlaceholder: "Uma breve descrição sobre este plano de leitura",
      books: "Livros da Bíblia",
      booksDescription: "Selecione os livros na ordem que deseja ler. A ordem é importante.",
      selectBooks: "Selecione os livros...",
      searchBooks: "Buscar livro...",
      noBookFound: "Nenhum livro encontrado.",
      duration: "Duração (em dias)",
      durationPlaceholder: "Ex: 90",
      submit: "Criar Plano",
      creating: "Criando...",
    },
    success: "Plano de leitura criado com sucesso!",
    error: "Erro ao criar plano",
  },
  en: {
    title: "Create Custom Reading Plan",
    description: "Choose the books, set the deadline, and we'll build the plan for you.",
    form: {
      name: "Plan Name",
      namePlaceholder: "Ex: Reading the Pentateuch",
      description: "Description (Optional)",
      descriptionPlaceholder: "A brief description about this reading plan",
      books: "Books of the Bible",
      booksDescription: "Select the books in the order you want to read them. The order is important.",
      selectBooks: "Select books...",
      searchBooks: "Search book...",
      noBookFound: "No book found.",
      duration: "Duration (in days)",
      durationPlaceholder: "Ex: 90",
      submit: "Create Plan",
      creating: "Creating...",
    },
    success: "Reading plan created successfully!",
    error: "Error creating plan",
  },
  es: {
    title: "Crear Plan de Lectura Personalizado",
    description: "Elige los libros, establece el plazo y nosotros creamos el plan para ti.",
    form: {
      name: "Nombre del Plan",
      namePlaceholder: "Ej: Leyendo el Pentateuco",
      description: "Descripción (Opcional)",
      descriptionPlaceholder: "Una breve descripción sobre este plan de lectura",
      books: "Libros de la Biblia",
      booksDescription: "Selecciona los libros en el orden que deseas leer. El orden es importante.",
      selectBooks: "Selecciona los libros...",
      searchBooks: "Buscar libro...",
      noBookFound: "No se encontró ningún libro.",
      duration: "Duración (en días)",
      durationPlaceholder: "Ej: 90",
      submit: "Crear Plan",
      creating: "Creando...",
    },
    success: "¡Plan de lectura creado con éxito!",
    error: "Error al crear el plan",
  },
};

export const CreatePlanForm: React.FC<{ lang: Locale }> = ({ lang }) => {
  const t = texts[lang] || texts.pt;
  const [isPending, setIsPending] = useState(false);
  const [bibleMetadata, setBibleMetadata] = useState<BibleMeta[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof createPlanSchema>>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      books: [],
      duration: 30,
      lang: lang,
    },
  });

  useEffect(() => {
    async function loadData() {
      const data = await getBibleMetadata(lang);
      setBibleMetadata(data);
    }
    loadData();
  }, [lang]);

  const onSubmit = async (values: z.infer<typeof createPlanSchema>) => {
    setIsPending(true);
    const result = await createUserReadingPlan(values);
    if (result.success) {
      toast.success(t.success);
      form.reset();
      setSelectedBooks([]);
    } else {
      toast.error(`${t.error}: ${result.message}`);
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

  const handleBookRemove = (bookName: string) => {
    const newSelectedBooks = selectedBooks.filter(b => b !== bookName);
    setSelectedBooks(newSelectedBooks);
    form.setValue("books", newSelectedBooks, { shouldValidate: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.name}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.form.namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.description}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.form.descriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="books"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t.form.books}</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}
                        >
                          {t.form.selectBooks}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder={t.form.searchBooks} />
                        <CommandList>
                          <CommandEmpty>{t.form.noBookFound}</CommandEmpty>
                          <CommandGroup>
                            {bibleMetadata.map((book) => (
                              <CommandItem
                                key={book.book}
                                value={book.book}
                                onSelect={() => handleBookSelect(book.book)}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", selectedBooks.includes(book.book) ? "opacity-100" : "opacity-0")}
                                />
                                {getTranslatedBookName(book.book, lang)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>{t.form.booksDescription}</FormDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedBooks.map(book => (
                      <Badge key={book} variant="secondary" className="flex items-center gap-1">
                        {getTranslatedBookName(book, lang)}
                        <button type="button" onClick={() => handleBookRemove(book)} className="rounded-full hover:bg-muted-foreground/20">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.duration}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={t.form.durationPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? t.form.creating : t.form.submit}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};