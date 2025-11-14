"use client";

import React, { useEffect, useState } from "react";
import { Locale } from "@/lib/i18n/config";
import { PostForm } from "@/components/admin/blog/post-form";
import type { GeneratedImageData } from "@/app/actions/image-generation";

type PostStatus = 'draft' | 'published' | 'archived';

type InitialPostData = {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status?: PostStatus;
  category_ids?: string[];
  published_at?: string | null;
  scheduled_for?: string | null;
};

interface NewPostInitializerProps {
  lang: Locale;
  initialImages: GeneratedImageData[];
  initialDataFromQuery?: InitialPostData | null;
}

const texts = {
  pt: {
    reviewTitle: "Revisar Post Gerado por IA",
    reviewDesc: "Ajuste o conteúdo gerado pela IA antes de publicar.",
    createTitle: "Criar Nova Postagem",
    createDesc: "Preencha os detalhes abaixo para criar uma nova postagem no blog."
  },
  en: {
    reviewTitle: "Review AI-generated Post",
    reviewDesc: "Adjust the AI-generated content before publishing.",
    createTitle: "Create New Post",
    createDesc: "Fill in the details below to create a new blog post."
  },
  es: {
    reviewTitle: "Revisar Entrada Generada por IA",
    reviewDesc: "Ajusta el contenido generado por IA antes de publicar.",
    createTitle: "Crear Nueva Entrada",
    createDesc: "Completa los detalles a continuación para crear una nueva entrada del blog."
  }
};

export function NewPostInitializer({
  lang,
  initialImages,
  initialDataFromQuery
}: NewPostInitializerProps) {
  const [initialData, setInitialData] = useState<InitialPostData | null>(null);

  useEffect(() => {
    // 1) tenta carregar do localStorage (fluxo do AI Writer atualizado)
    try {
      const raw = window.localStorage.getItem("ai_writer_initial_post");
      if (raw) {
        const parsed = JSON.parse(raw) as InitialPostData;
        setInitialData(parsed);
        // Limpa para não reaplicar em próximos acessos
        window.localStorage.removeItem("ai_writer_initial_post");
        return;
      }
    } catch (e) {
      console.warn("Falha ao ler dados do AI Writer no localStorage", e);
    }
    // 2) fallback para o que vier por query (compatibilidade com fluxo antigo)
    if (initialDataFromQuery) {
      setInitialData(initialDataFromQuery);
    }
  }, [initialDataFromQuery]);

  const t = texts[lang] || texts.pt;
  const isReview = !!initialData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isReview ? t.reviewTitle : t.createTitle}
        </h1>
        <p className="text-muted-foreground">
          {isReview ? t.reviewDesc : t.createDesc}
        </p>
      </div>
      <PostForm 
        lang={lang} 
        initialData={initialData || null}
        initialImages={initialImages}
      />
    </div>
  );
}