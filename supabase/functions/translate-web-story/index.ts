// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: any;
declare const Request: any;
declare const Response: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const TARGET_LANGUAGES = ['en', 'es'];
const SOURCE_LANGUAGE = 'pt';
const OPENAI_MODEL = 'gpt-4o-mini';

// Helper para extrair textos do JSON da story
function extractTexts(storyData: any): Record<string, string> {
  const texts: Record<string, string> = {};
  if (!storyData?.pages) return texts;
  
  storyData.pages.forEach((page: any) => {
    if (page.elements) {
      page.elements.forEach((element: any) => {
        // Extrai conteúdo apenas de elementos de texto
        if (element.type === 'text' && element.content) {
          texts[element.id] = element.content;
        }
      });
    }
  });
  return texts;
}

// Helper para injetar textos traduzidos de volta no JSON
function injectTexts(storyData: any, translatedTexts: Record<string, string>): any {
  // Deep copy para não mutar o original
  const newData = JSON.parse(JSON.stringify(storyData));
  if (!newData?.pages) return newData;

  newData.pages.forEach((page: any) => {
    if (page.elements) {
      page.elements.forEach((element: any) => {
        if (element.type === 'text' && translatedTexts[element.id]) {
          element.content = translatedTexts[element.id];
        }
      });
    }
  });
  return newData;
}

async function translateTexts(texts: Record<string, string>, targetLang: string) {
  const systemPrompt = `You are a translator for Web Stories. Translate the values of the JSON object provided from ${SOURCE_LANGUAGE} to ${targetLang}. 
  IMPORTANT:
  1. Keep the HTML tags (like <strong>, <em>, <br>) intact inside the strings.
  2. Do NOT translate the keys (IDs).
  3. Return ONLY the valid JSON object with the translated values.`;

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
        { role: "user", content: JSON.stringify(texts) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

// Função simples para traduzir string única (título)
async function translateString(text: string, targetLang: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: `Translate from ${SOURCE_LANGUAGE} to ${targetLang}. Return only the translated text.` },
        { role: "user", content: text },
      ],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function submitUrlToIndexNow(url: string) {
  const apiKey = Deno.env.get('INDEXNOW_API_KEY');
  if (!apiKey) {
    console.warn("IndexNow (translation): API key not configured.");
    return;
  }
  try {
    const payload = {
      host: "www.paxword.com",
      key: apiKey,
      keyLocation: `https://www.paxword.com/${apiKey}.txt`,
      urlList: [url],
    };
    await fetch("https://api.indexnow.org/indexnow", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("IndexNow (translation): Failed to submit URL.", e);
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Inicializa o cliente Supabase para verificação de token
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Autenticação (Token de usuário ou Segredo Interno)
  const authHeader = req.headers.get('Authorization');
  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  
  let isAuthorized = false;

  // 1. Verifica Segredo Interno
  if (internalSecret && expectedSecret && internalSecret === expectedSecret) {
    isAuthorized = true;
  } 
  // 2. Verifica Token de Usuário
  else if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user && !error) {
      // --- SECURITY CHECK: VERIFY ROLE ---
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'writer') {
        isAuthorized = true;
      }
      // -----------------------------------
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized: Insufficient permissions." }), { 
      status: 403, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const { storyId, title, storyData } = await req.json();

    if (!storyId || !title || !storyData) {
      throw new Error("Missing required fields.");
    }

    const { data: story } = await supabase.from('web_stories').select('slug').eq('id', storyId).single();
    if (!story) throw new Error("Original story not found.");

    // 1. Extrair textos do JSON complexo
    const extractedTexts = extractTexts(storyData);
    const hasTexts = Object.keys(extractedTexts).length > 0;

    const results = [];

    // 2. Para cada idioma alvo, traduzir e salvar
    for (const targetLang of TARGET_LANGUAGES) {
      try {
        // Traduz o título
        const translatedTitle = await translateString(title, targetLang);
        
        // Traduz o conteúdo JSON (se houver textos)
        let translatedStoryData = storyData;
        if (hasTexts) {
          const translatedMap = await translateTexts(extractedTexts, targetLang);
          translatedStoryData = injectTexts(storyData, translatedMap);
        }

        // Salva na tabela de traduções
        const { error } = await supabase
          .from('web_story_translations')
          .upsert({
            story_id: storyId,
            language_code: targetLang,
            title: translatedTitle,
            story_data: translatedStoryData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'story_id, language_code' });

        if (error) throw error;
        
        const translatedUrl = `https://www.paxword.com/${targetLang}/web-stories/${story.slug}`;
        await submitUrlToIndexNow(translatedUrl);

        results.push(targetLang);

      } catch (err) {
        console.error(`Error translating to ${targetLang}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Story translations processed.",
      languages: results 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});