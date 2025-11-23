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

const postOutputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  summary: z.string().nullable(),
  seo_title: z.string(),
  seo_description: z.string(),
});

export type AIResponse = z.infer<typeof postOutputSchema>;

// --- Função de finalização com Claude e fallback para OpenAI ---
async function refineAndFinalizeContent(content: string): Promise<AIResponse> {
  // 1. Tentar com o modelo principal (Claude 3.5 Sonnet)
  try {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY not set. Skipping to fallback.");
    }

    const model = "claude-sonnet-4-5-20250929";
    const systemPrompt = `Você é um editor teológico e especialista em SEO para conteúdo cristão. Sua tarefa é pegar um rascunho de post em Markdown e transformá-lo em um artigo completo e otimizado.

Sua saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
  "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
  "content": "O corpo do post em formato Markdown, refinado para ter um tom pessoal, envolvente e teologicamente sólido. Otimize para SEO, usando subtítulos (H2, H3) e palavras-chave relevantes. Não inclua o título principal (H1) aqui.",
  "summary": "Um resumo instigante e direto com no máximo 300 caracteres. PROIBIDO começar com clichês como 'Descubra', 'Aprenda', 'Veja', 'Neste artigo' ou 'Explore'. Comece com uma pergunta retórica, uma afirmação impactante ou vá direto ao ponto central da reflexão.",
  "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
  "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
}

IMPORTANTE: Garanta que qualquer quebra de linha dentro dos valores de string do JSON (como no campo 'content') seja devidamente escapada como '\\n'.

Instruções para o refinamento do conteúdo:
1.  Reescreva o texto com um tom altamente pessoal e envolvente, falando diretamente ao leitor.
2.  Melhore a profundidade teológica, a clareza e o tom inspirador.
3.  Garanta que a estrutura do conteúdo seja clara, usando subtítulos (H2, H3) e listas quando apropriado.`;
    
    const userPrompt = `Refine este rascunho e crie o JSON completo:\n\n${content}`;
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error with model ${model}: ${await response.text()}`);
    }

    const data = await response.json();
    const jsonString = data.content[0].text;
    
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Claude model ${model} did not return a valid JSON object.`);
    }
    
    const parsedJson = JSON.parse(jsonMatch[0]);
    const validatedData = postOutputSchema.parse(parsedJson);
    
    console.log(`Content successfully finalized by Claude using model: ${model}.`);
    return validatedData;

  } catch (claudeError) {
    const message = claudeError instanceof Error ? claudeError.message : String(claudeError);
    console.warn(`Primary refinement with Claude failed: ${message}. Falling back to OpenAI GPT-4o.`);
    
    // 2. Se Claude falhar, usar o fallback (OpenAI GPT-4o)
    try {
      const systemPrompt = `Você é um editor teológico e especialista em SEO para conteúdo cristão. Sua tarefa é pegar um rascunho de post em Markdown e transformá-lo em um artigo completo e otimizado.

Sua saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
  "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
  "content": "O corpo do post em formato Markdown, refinado para ter um tom pessoal, envolvente e teologicamente sólido. Otimize para SEO, usando subtítulos (H2, H3) e palavras-chave relevantes. Não inclua o título principal (H1) aqui.",
  "summary": "Um resumo instigante e direto com no máximo 300 caracteres. PROIBIDO começar com clichês como 'Descubra', 'Aprenda', 'Veja', 'Neste artigo' ou 'Explore'. Comece com uma pergunta retórica, uma afirmação impactante ou vá direto ao ponto central da reflexão.",
  "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
  "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
}

Instruções para o refinamento do conteúdo:
1.  Reescreva o texto com um tom altamente pessoal e envolvente, falando diretamente ao leitor.
2.  Melhore a profundidade teológica, a clareza e o tom inspirador.
3.  Garanta que a estrutura do conteúdo seja clara, usando subtítulos (H2, H3) e listas quando apropriado.`;

      const userPrompt = `Refine este rascunho e crie o JSON completo:\n\n${content}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      });

      const jsonString = response.choices[0].message.content;
      if (!jsonString) {
        throw new Error("OpenAI (GPT-4o) did not return any content.");
      }

      const parsedJson = JSON.parse(jsonString);
      const validatedData = postOutputSchema.parse(parsedJson);
      
      console.log("Content successfully finalized by OpenAI using model: gpt-4o.");
      return validatedData;

    } catch (openAIError) {
      const message = openAIError instanceof Error ? openAIError.message : String(openAIError);
      console.error(`Fallback refinement with OpenAI also failed: ${message}`);
      throw openAIError;
    }
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
    // 1. Gerar rascunho inicial com OpenAI
    const openAISystemPrompt = `Você é um assistente de IA especializado em criar rascunhos para um blog bíblico. Seu público é primariamente cristão. O idioma do conteúdo gerado deve ser ${request.lang}. Gere APENAS o corpo do post em formato Markdown. Não inclua um título principal (H1). Comece diretamente com o primeiro parágrafo ou um subtítulo (H2).`;

    let openAIUserPrompt = "";
    const { type, context } = request;

    switch (type) {
      case "devotional":
        openAIUserPrompt = `Gere um rascunho de post devocional baseado no versículo: ${context.book} ${context.chapter}:${context.verse}. O post deve incluir: uma reflexão sobre o versículo, uma aplicação prática para o dia a dia e uma breve oração.`;
        break;
      case "thematic":
        openAIUserPrompt = `Gere um rascunho para o primeiro post de uma série temática sobre "${context.theme}". O post deve introduzir o tema, discutir sua importância à luz da Bíblia e usar pelo menos um versículo relevante como base.`;
        break;
      case "summary":
        openAIUserPrompt = `Gere um rascunho que resume o capítulo ${context.chapter} do livro de ${context.book}. O resumo deve ser em linguagem acessível, destacando os principais eventos, personagens e ensinamentos do capítulo.`;
        break;
      default:
        return { success: false, message: "Tipo de geração inválido." };
    }

    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: openAISystemPrompt },
        { role: "user", content: openAIUserPrompt },
      ],
      temperature: 0.7,
    });

    const initialDraft = openAIResponse.choices[0].message.content;
    if (!initialDraft) {
      throw new Error("A resposta da OpenAI (rascunho inicial) está vazia.");
    }

    // 2. Refinar e finalizar com Claude ou OpenAI
    const finalPostObject = await refineAndFinalizeContent(initialDraft);

    return { success: true, data: finalPostObject };
  } catch (error) {
    console.error("Erro ao gerar post com IA:", error);
    
    let errorMessage = "Falha ao comunicar com as APIs de IA.";
    
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
  const supabase = await createSupabaseServerClient();
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
    const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.rpc('get_bible_metadata', {
    lang_code: lang,
  });

  if (error) {
    console.error("Error fetching bible metadata:", error);
    return [];
  }

  return data;
}