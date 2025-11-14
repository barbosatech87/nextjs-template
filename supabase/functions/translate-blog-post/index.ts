// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Adicionando declarações de tipos para os módulos Deno/ESM
declare const Deno: any;
declare const Request: any;
declare const Response: any;

// Define os cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define os idiomas alvo
const TARGET_LANGUAGES = ['en', 'es'];
const SOURCE_LANGUAGE = 'pt';
const OPENAI_MODEL = 'gpt-4o-mini'; // Usando o modelo sugerido

// Interface para o corpo da requisição
interface TranslationRequest {
  postId: string;
  title: string;
  summary: string | null;
  content: string;
}

// Função para chamar a API da OpenAI
async function getTranslation(text: string, targetLang: string, type: 'title' | 'summary' | 'content') {
  let systemPrompt = `You are a professional translator. Translate the following ${type} from ${SOURCE_LANGUAGE} to ${targetLang}. Maintain the original formatting (Markdown/HTML) for the content. Only return the translated text, nothing else.`;
  
  if (type === 'content') {
    systemPrompt = `You are a professional translator. Translate the following content from ${SOURCE_LANGUAGE} to ${targetLang}. The content is in Markdown format. IMPORTANT: Do NOT include the main title (H1) in the translated content. Use H2, H3, lists, etc., as needed. Only return the translated text, nothing else.`;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

serve(async (req: Request) => {
  // Lida com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Autenticação (Manual, conforme regra)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  
  // Cria o cliente Supabase com a Service Role Key para acesso irrestrito ao DB
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    const { postId, title, summary, content } = await req.json() as TranslationRequest;

    if (!postId || !title || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields: postId, title, or content." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translationPromises = TARGET_LANGUAGES.map(async (targetLang) => {
      // Traduzir todos os campos em paralelo
      const [translatedTitle, translatedSummary, translatedContent] = await Promise.all([
        getTranslation(title, targetLang, 'title'),
        summary ? getTranslation(summary, targetLang, 'summary') : Promise.resolve(null),
        getTranslation(content, targetLang, 'content'),
      ]);

      // Salvar no banco de dados
      const { error } = await supabase
        .from('blog_post_translations')
        .insert({
          post_id: postId,
          language_code: targetLang,
          translated_title: translatedTitle,
          translated_summary: translatedSummary,
          translated_content: translatedContent,
        });

      if (error) {
        console.error(`Error saving ${targetLang} translation for post ${postId}:`, error);
        throw new Error(`Database error for ${targetLang}`);
      }
      
      return { language: targetLang, success: true };
    });

    const results = await Promise.allSettled(translationPromises);
    
    const successfulTranslations = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => (r as PromiseFulfilledResult<{ language: string }>).value.language);

    return new Response(JSON.stringify({ 
      message: "Translation process initiated.",
      successful: successfulTranslations,
      total_targets: TARGET_LANGUAGES.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});