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
const OPENAI_MODEL = 'gpt-4o-mini';

// Interface para o corpo da requisição
interface TranslationRequest {
  pageId: string;
  title: string;
  summary: string | null;
  content: string;
}

// Função para chamar a API da OpenAI
async function getTranslation(text: string, targetLang: string, type: 'title' | 'summary' | 'content') {
  if (!text) return null;
  const systemPrompt = `You are a professional translator. Translate the following ${type} from ${SOURCE_LANGUAGE} to ${targetLang}. Maintain the original formatting (Markdown). Only return the translated text, nothing else.`;

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Verification Check
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // --- SECURITY CHECK: VERIFY ROLE ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    return new Response(JSON.stringify({ error: "Unauthorized: Insufficient permissions." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // -----------------------------------

  try {
    const { pageId, title, summary, content } = await req.json() as TranslationRequest;

    if (!pageId || !title || !content) {
      return new Response(JSON.stringify({ error: "Missing required fields: pageId, title, or content." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translationPromises = TARGET_LANGUAGES.map(async (targetLang) => {
      const [translatedTitle, translatedSummary, translatedContent] = await Promise.all([
        getTranslation(title, targetLang, 'title'),
        getTranslation(summary, targetLang, 'summary'),
        getTranslation(content, targetLang, 'content'),
      ]);

      const { error } = await supabase
        .from('page_translations')
        .insert({
          page_id: pageId,
          language_code: targetLang,
          translated_title: translatedTitle,
          translated_summary: translatedSummary,
          translated_content: translatedContent,
        });

      if (error) {
        console.error(`Error saving ${targetLang} translation for page ${pageId}:`, error);
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