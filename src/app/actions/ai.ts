"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { Locale } from "@/lib/i18n/config";
import OpenAI from "openai";
import { z } from "zod";

// Inicializa o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Tipos e Schemas ---
const generationRequestSchema = z.object({
  lang: z.custom<Locale>(),
  type: z.enum(["devotional", "thematic", "summary"]),
  context: z.object({
    book: z.string().optional(),
    chapter: z.number().optional(),
    verse: z.number().optional(),
    theme: z.string().optional(),
  }),
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;

const postOutputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  summary: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
});

export type AIResponse = z.infer<typeof postOutputSchema>;

// --- Função Principal de Geração ---
export async function generatePostWithAI(
  request: GenerationRequest
): Promise<{ success: boolean; data?: AIResponse; message?: string }> {
  const validation = generationRequestSchema.safeParse(request);
  if (!validation.success) {
    return { success: false, message: "Dados de entrada inválidos." };
  }

  try {
    const systemPrompt = `
      Você é um assistente de IA especializado em criar conteúdo para um blog bíblico.
      Seu público é primariamente cristão.
      Todo o conteúdo deve ser otimizado para SEO, com linguagem clara, inspiradora e teologicamente sólida.
      O idioma do conteúdo gerado deve ser ${request.lang}.
      Sua resposta DEVE ser um objeto JSON com a seguinte estrutura:
      {
        "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
        "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
        "content": "O conteúdo principal do post em formato Markdown. Deve ser bem estruturado, com parágrafos, e talvez listas ou subtítulos. Deve ter pelo menos 3 parágrafos.",
        "summary": "Um resumo conciso do post com no máximo 300 caracteres.",
        "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
        "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
      }
    `;

    let userPrompt = "";
    const { type, context, lang } = request;

    switch (type) {
      case "devotional":
        userPrompt = `Gere um post devocional baseado no versículo: ${context.book} ${context.chapter}:${context.verse}. O post deve incluir: uma reflexão sobre o versículo, uma aplicação prática para o dia a dia e uma breve oração.`;
        break;
      case "thematic":
        userPrompt = `Gere o primeiro post de uma série temática sobre "${context.theme}". O post deve introduzir o tema, discutir sua importância à luz da Bíblia e usar pelo menos um versículo relevante como base.`;
        break;
      case "summary":
        userPrompt = `Gere um post que resume o capítulo ${context.chapter} do livro de ${context.book}. O resumo deve ser em linguagem acessível, destacando os principais eventos, personagens e ensinamentos do capítulo.`;
        break;
      default:
        return { success: false, message: "Tipo de geração inválido." };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("A resposta da IA está vazia.");
    }

    const parsedContent = postOutputSchema.parse(JSON.parse(content));
    return { success: true, data: parsedContent };
  } catch (error) {
    console.error("Erro ao gerar post com IA:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "A IA retornou um formato de dados inesperado." };
    }
    return { success: false, message: "Falha ao comunicar com a API da OpenAI." };
  }
}

// --- Função para buscar metadados da Bíblia ---
export async function getBibleMetadata(lang: Locale) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_bible_metadata', { lang_code: lang });

    if (error) {
        console.error('Error fetching bible metadata:', error);
        return [];
    }
    return data;
}