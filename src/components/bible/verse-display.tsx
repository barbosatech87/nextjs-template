"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star, FilePenLine } from 'lucide-react';
import { User } from '@supabase/supabase-js';

import { Verse } from '@/types/supabase';
import { Locale } from '@/lib/i18n/config';
import { toggleFavoriteVerse } from '@/app/actions/favorites';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerseNoteDialog } from '@/components/bible/verse-note-dialog';
import { AuthPromptDialog } from '@/components/auth/auth-prompt-dialog';

interface VerseDisplayProps {
  lang: Locale;
  verses: Verse[];
  user: User | null;
  initialFavoriteVerseIds: Set<string>;
  initialNotes: Record<string, string>;
}

const t = {
    pt: {
        favorite: "Favoritar",
        unfavorite: "Remover dos favoritos",
        favoriteSuccess: "Adicionado aos favoritos!",
        unfavoriteSuccess: "Removido dos favoritos!",
        favoriteError: "Erro ao gerenciar favoritos.",
        addNote: "Adicionar/Editar anotação",
    },
    en: {
        favorite: "Favorite",
        unfavorite: "Remove from favorites",
        favoriteSuccess: "Added to favorites!",
        unfavoriteSuccess: "Removed from favorites!",
        favoriteError: "Error managing favorites.",
        addNote: "Add/Edit note",
    },
    es: {
        favorite: "Marcar como favorito",
        unfavorite: "Quitar de favoritos",
        favoriteSuccess: "¡Añadido a favoritos!",
        unfavoriteSuccess: "¡Quitado de favoritos!",
        favoriteError: "Error al gestionar favoritos.",
        addNote: "Añadir/Editar anotación",
    }
};

export const VerseDisplay: React.FC<VerseDisplayProps> = ({
  lang,
  verses,
  user,
  initialFavoriteVerseIds,
  initialNotes,
}) => {
  const router = useRouter();
  const locale = t[lang] || t.pt;
  const [isFavoritePending, startFavoriteTransition] = useTransition();

  const [optimisticFavorites, setOptimisticFavorites] = useState(initialFavoriteVerseIds);
  const [optimisticNotes, setOptimisticNotes] = useState(initialNotes);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<Verse | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const handleAuthPrompt = () => {
    setAuthPromptOpen(true);
  };

  const handleConfirmAuth = () => {
    router.push(`/${lang}/auth`);
  };

  const handleToggleFavorite = (verse: Verse) => {
    if (!user) {
      handleAuthPrompt();
      return;
    }

    const isFavorited = optimisticFavorites.has(verse.id);
    
    setOptimisticFavorites(prev => {
        const newSet = new Set(prev);
        if (isFavorited) newSet.delete(verse.id);
        else newSet.add(verse.id);
        return newSet;
    });

    startFavoriteTransition(async () => {
        const result = await toggleFavoriteVerse(verse, isFavorited);
        if (result.success) {
            toast.success(isFavorited ? locale.unfavoriteSuccess : locale.favoriteSuccess);
        } else {
            toast.error(locale.favoriteError);
            setOptimisticFavorites(initialFavoriteVerseIds);
        }
    });
  };

  const handleOpenNoteDialog = (verse: Verse) => {
    if (!user) {
      handleAuthPrompt();
      return;
    }
    setSelectedVerseForNote(verse);
    setNoteDialogOpen(true);
  };

  const handleNoteSave = (verseId: string, newNote: string) => {
    setOptimisticNotes(prev => ({ ...prev, [verseId]: newNote }));
  };

  if (!verses || verses.length === 0) {
    return <p>Nenhum versículo encontrado para este capítulo.</p>;
  }

  return (
    <div className="prose prose-lg lg:prose-xl max-w-none font-serif text-foreground">
      {verses.map((verse) => {
        const isFavorited = optimisticFavorites.has(verse.id);
        const hasNote = !!optimisticNotes[verse.id] && optimisticNotes[verse.id].trim() !== '';
        return (
          <div key={verse.id} id={`v${verse.verse_number}`} className="flex items-start gap-2 group scroll-mt-20">
            <p className="flex-1 mb-4 leading-relaxed">
              <sup className="font-sans font-bold text-primary text-sm top-[-0.5em] mr-1">
                {verse.verse_number}
              </sup>
              <span className="break-words">{verse.text}</span>
            </p>
            <TooltipProvider>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenNoteDialog(verse)}>
                      <FilePenLine className={`h-4 w-4 ${hasNote ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{locale.addNote}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleFavorite(verse)} disabled={isFavoritePending}>
                      <Star className={`h-4 w-4 ${isFavorited ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isFavorited ? locale.unfavorite : locale.favorite}</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        );
      })}
      {selectedVerseForNote && (
        <VerseNoteDialog
          lang={lang}
          verse={selectedVerseForNote}
          initialNote={optimisticNotes[selectedVerseForNote.id] || ''}
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          onNoteSave={handleNoteSave}
        />
      )}
      <AuthPromptDialog
        lang={lang}
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        onConfirm={handleConfirmAuth}
      />
    </div>
  );
};