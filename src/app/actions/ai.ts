"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { Locale } from "@/lib/i18n/config";
import OpenAI from "openai";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Inicializa o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Função de refinamento com Claude (versão corrigida) ---
async function refineContentWithClaude(content: string): Promise<string> {
  if (!process.env.CLAUDE_API_KEY) {
    console.warn("CLAUDE_API_KEY not set. Skipping refinement step.");
    return content;
  }

  try {
    // O system prompt define o papel e as instruções da IA.
    const systemPrompt = `Você é um editor teológico especialista. Refine o rascunho de post a seguir para melhorar sua profundidade teológica, clareza e tom inspirador, com um estilo pessoal e voltado para o público cristão. Otimize o texto para SEO, garantindo que as palavras-chave e a estrutura sejam amigáveis para ranqueamento. Mantenha o formato Markdown e a estrutura geral. Retorne APENAS o conteúdo Markdown refinado do corpo do post, nada mais.`;
    
    // O user prompt contém o conteúdo a ser refinado.
    const userPrompt = `Refine este rascunho de conteúdo:\n\n${content}`;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        // Usando o parâmetro oficial 'system' para as instruções.
        system: systemPrompt,
        // O array 'messages' agora contém apenas o conteúdo do usuário.
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // A estrutura de resposta da API do Claude tem o conteúdo em um array.
    const refinedContent = data.content[0].text;
    
    console.log("Content successfully refined by Claude.");
    return refinedContent;

  } catch (error) {
    console.error("Error refining content with Claude:", error);
    // Se o refinamento falhar, retorna o conteúdo original para não quebrar o fluxo.
    return content;
  }
}

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
  summary: z.string().nullable(),
  seo_title: z.string(),
  seo_description: z.string(),
});

export type AIResponse = z.infer<typeof postOutputSchema>;

// --- Função Principal de Geração de Post ---
export async function generatePostWithAI(
  request: GenerationRequest
): Promise<{ success: boolean; data?: AIResponse; message?: string }> {
  const validation = generationRequestSchema.safeParse(request);
  if (!validation.success) {
    return { success: false, message: "Dados de entrada inválidos." };
  }
  
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: "Chave da API OpenAI não configurada no servidor." };
  }

  try {
    const systemPrompt = `
      Você é um assistente de IA especializado em criar conteúdo para um blog bíblico.
      Seu público é primariamente cristão.
      Todo o conteúdo deve ser otimizado para SEO, com linguagem clara, inspiradora e teologicamente sólida.
      O idioma do conteúdo gerado deve ser ${request.lang}.
      
      Instruções de Formatação:
      1. O campo "title" deve conter apenas o título principal.
      2. O campo "content" deve conter o corpo do artigo em Markdown. Não inclua o título principal (H1) no campo "content". Use subtítulos (H2, H3) e formatação Markdown (negrito, listas) conforme necessário.
      
      Sua resposta DEVE ser um objeto JSON com a seguinte estrutura:
      {
        "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
        "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
        "content": "O corpo do post em formato Markdown, começando diretamente com o primeiro parágrafo ou subtítulo (H2). Deve ter pelo menos 3 parágrafos.",
        "summary": "Um resumo conciso do post com no máximo 300 caracteres. Pode ser nulo se não for relevante.",
        "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
        "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
      }
    `;

    let userPrompt = "";
    const { type, context } = request;

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

    if (parsedContent.content) {
        console.log("Refining content with Claude...");
        parsedContent.content = await refineContentWithClaude(parsedContent.content);
    }

    return { success: true, data: parsedContent };
  } catch (error) {
    console.error("Erro ao gerar post com IA:", error);
    
    let errorMessage = "Falha ao comunicar com a API da OpenAI.";
    
    if (error instanceof z.ZodError) {
      errorMessage = "A IA retornou um formato de dados inesperado.";
    } else if (error instanceof OpenAI.APIError) {
      errorMessage = `Erro da API OpenAI: ${error.status} - ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, message: errorMessage };
  }
}

/**
 * Gera uma imagem chamando a Edge Function.
 */
export async function generateImageAction(prompt: string): Promise<{ success: boolean; url?: string; message?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, message: "Usuário não autenticado." };
  }

  try {
    const functionUrl = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/generate-image`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || "Failed to generate image.";
      console.error("Edge Function Error Response:", errorMessage);
      return { success: false, message: `Falha ao gerar imagem: ${errorMessage}` };
    }

    const imageUrl = data.imageUrl;
    if (!imageUrl) {
      return { success: false, message: "A Edge Function não retornou uma URL de imagem." };
    }

    return { success: true, url: imageUrl };

  } catch (error) {
    console.error("Erro ao gerar imagem com IA:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return { success: false, message: `Falha ao comunicar com o gerador de imagem: ${errorMessage}` };
  }
}

/**
 * Salva a imagem gerada no banco de dados após a confirmação do usuário.
 */
export async function saveGeneratedImage(prompt: string, imageUrl: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Usuário não autenticado." };
    }

    const { error: dbError } = await supabase
      .from('generated_images')
      .insert({
        user_id: user.id,
        prompt: prompt,
        image_url: imageUrl,
        model: 'dall-e-3'
      });

    if (dbError) {
      throw new Error(`Falha ao salvar a imagem no banco de dados: ${dbError.message}`);
    }

    revalidatePath('/admin/ai-image-generator');
    return { success: true };

  } catch (error) {
    console.error("Erro ao salvar imagem gerada:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return { success: false, message: `Falha ao salvar imagem: ${errorMessage}` };
  }
}


/**
 * Busca metadados da Bíblia (livro e total de capítulos) para um idioma específico.
 */
export async function getBibleMetadata(lang: Locale) {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc('get_bible_metadata', {
    lang_code: lang,
  });

  if (error) {
    console.error("Error fetching bible metadata:", error);
    return [];
  }

  return data;
}