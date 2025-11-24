"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Locale } from '@/lib/i18n/config';
import { FileText, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { HydratedNote, upsertVerseNote } from '@/app/actions/notes';
import { getTranslatedBookName } from '@/lib/bible-translations';
import { Button } from '@/components/ui/button';
import { VerseNoteDialog } from '@/components/bible/verse-note-dialog';
import { Verse } from '@/types/supabase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface NotesTabProps {
  lang: Locale;
  notes: HydratedNote[];
}

const texts = {
  pt: {
    title: "Minhas Anotações",
    searchPlaceholder: "Buscar em anotações...",
    emptyState: "Você ainda não tem nenhuma anotação. Comece a adicionar notas aos versículos durante suas leituras!",
    emptyStateWithSearch: "Nenhuma anotação encontrada para sua busca.",
    deleteConfirmTitle: "Tem certeza?",
    deleteConfirmDescription: "Esta ação não pode ser desfeita. Sua anotação será permanentemente removida.",
    cancel: "Cancelar",
    delete: "Deletar",
    deleting: "Deletando...",
    deleteSuccess: "Anotação removida!",
    deleteError: "Erro ao remover anotação.",
    previous: "Anterior",
    next: "Próximo",
  },
  en: {
    title: "My Notes",
    searchPlaceholder: "Search in notes...",
    emptyState: "You don't have any notes yet. Start adding notes to verses during your readings!",
    emptyStateWithSearch: "No notes found for your search.",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDescription: "This action cannot be undone. Your note will be permanently removed.",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting...",
    deleteSuccess: "Note removed!",
    deleteError: "Error removing note.",
    previous: "Previous",
    next: "Next",
  },
  es: {
    title: "Mis Anotaciones",
    searchPlaceholder: "Buscar en anotaciones...",
    emptyState: "Aún no tienes ninguna anotación. ¡Empieza a añadir notas a los versículos durante tus lecturas!",
    emptyStateWithSearch: "No se encontraron anotaciones para tu búsqueda.",
    deleteConfirmTitle: "¿Estás seguro?",
    deleteConfirmDescription: "Esta acción no se puede deshacer. Tu anotación será eliminada permanentemente.",
    cancel: "Cancelar",
    delete: "Eliminar",
    deleting: "Eliminando...",
    deleteSuccess: "¡Anotación eliminada!",
    deleteError: "Error al eliminar la anotación.",
    previous: "Anterior",
    next: "Siguiente",
  },
};

const ITEMS_PER_PAGE = 5;

export const NotesTab: React.FC<NotesTabProps> = ({ lang, notes: initialNotes }) => {
  const t = texts[lang] || texts.pt;
  const [notes, setNotes] = useState(initialNotes);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<Verse | null>(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) {
      return notes;
    }
    return notes.filter(note => {
      const verseReference = `${getTranslatedBookName(note.book, lang)} ${note.chapter}:${note.verse_number}`;
      const searchLower = searchQuery.toLowerCase();
      return (
        note.note.toLowerCase().includes(searchLower) ||
        note.text.toLowerCase().includes(searchLower) ||
        verseReference.toLowerCase().includes(searchLower)
      );
    });
  }, [notes, searchQuery, lang]);

  const totalPages = Math.ceil(filteredNotes.length / ITEMS_PER_PAGE);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenEditDialog = (note: HydratedNote) => {
    setSelectedVerseForNote(note.verse);
    setSelectedNoteContent(note.note);
    setNoteDialogOpen(true);
  };

  const handleNoteSave = (verseId: string, newNote: string) => {
    setNotes(prevNotes => {
      const existingNoteIndex = prevNotes.findIndex(n => n.verse_id === verseId);
      if (newNote.trim() === '') {
        return prevNotes.filter(n => n.verse_id !== verseId);
      }
      if (existingNoteIndex > -1) {
        const updatedNotes = [...prevNotes];
        updatedNotes[existingNoteIndex].note = newNote;
        updatedNotes[existingNoteIndex].updated_at = new Date().toISOString();
        return updatedNotes.sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime());
      }
      // This case is unlikely from the profile page but good to have
      return prevNotes;
    });
  };

  const handleDeleteNote = async (noteId: string, verseId: string) => {
    setIsDeleting(noteId);
    const result = await upsertVerseNote(verseId, ''); // Sending empty string deletes the note
    if (result.success) {
      toast.success(t.deleteSuccess);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } else {
      toast.error(t.deleteError);
    }
    setIsDeleting(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>

        {initialNotes.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">{t.emptyState}</p>
          </div>
        ) : paginatedNotes.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">{t.emptyStateWithSearch}</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {paginatedNotes.map((note) => {
              const verseReference = `${getTranslatedBookName(note.book, lang)} ${note.chapter}:${note.verse_number}`;
              const verseUrl = `/${lang}/bible/${note.book.toLowerCase().replace(/\s/g, '-')}/${note.chapter}#v${note.verse_number}`;
              return (
                <li key={note.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={verseUrl} className="hover:underline">
                        <h3 className="font-semibold text-lg">{verseReference}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground italic">"{note.text}"</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(note)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            {isDeleting === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{t.deleteConfirmDescription}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(note.id, note.verse_id)} className="bg-destructive hover:bg-destructive/90">
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{note.note}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                >
                  {t.previous}
                </PaginationPrevious>
              </PaginationItem>
              
              <PaginationItem>
                <span className="px-4 py-2 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                >
                  {t.next}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
      {selectedVerseForNote && (
        <VerseNoteDialog
          lang={lang}
          verse={selectedVerseForNote}
          initialNote={selectedNoteContent}
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          onNoteSave={handleNoteSave}
        />
      )}
    </Card>
  );
};