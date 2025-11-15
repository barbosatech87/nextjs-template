// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Adicionando declarações de tipos para os módulos Deno/ESM
declare const Deno: any;
declare const Request: any;
declare const Response: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_LANGUAGE_CODE = 'pt';
const TARGET_LANGUAGE_CODES = ['en', 'es'];
const OPENAI_MODEL = 'gpt-4o-mini';

// Interface para o versículo base (referência)
interface VerseReference {
    book: string;
    chapter: number;
    verse_number: number;
    version: string;
}

// Função para chamar a API da OpenAI para tradução
async function getTranslation(text: string, targetLang: string) {
  const systemPrompt = `You are a professional translator. Translate the following Bible verse text from Portuguese to ${targetLang}. Only return the translated text, nothing else.`;
  
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
    throw new Error(`OpenAI API error during translation: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Usamos a Service Role Key para garantir que podemos escrever no DB sem RLS
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Selecionar um versículo aleatório (referência) em Português
    const { data: refData, error: refError } = await supabase
        .rpc('get_random_verse', { lang_code: SOURCE_LANGUAGE_CODE })
        .single();

    if (refError || !refData) {
        console.error("Failed to get random verse reference:", refError);
        return new Response(JSON.stringify({ error: "Failed to get random verse reference." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    
    const verseRef = refData as VerseReference;

    // 2. Buscar o texto do versículo base (Português)
    const { data: ptVerse, error: ptError } = await supabase
        .from('verses')
        .select('text')
        .eq('book', verseRef.book)
        .eq('chapter', verseRef.chapter)
        .eq('verse_number', verseRef.verse_number)
        .eq('language_code', SOURCE_LANGUAGE_CODE)
        .single();

    if (ptError || !ptVerse) {
        console.error("Failed to fetch base verse text:", ptError);
        return new Response(JSON.stringify({ error: "Failed to fetch base verse text." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    
    const baseText = ptVerse.text;
    
    // 3. Traduzir o texto para os idiomas alvo
    const translationPromises = TARGET_LANGUAGE_CODES.map(async (targetLang) => {
        const translatedText = await getTranslation(baseText, targetLang);
        return { language_code: targetLang, text: translatedText };
    });

    const translatedResults = await Promise.all(translationPromises);
    
    // 4. Preparar todos os registros para inserção (incluindo o original)
    const allVerseData = [
        { language_code: SOURCE_LANGUAGE_CODE, text: baseText },
        ...translatedResults
    ];
    
    const insertRows = allVerseData.map(data => ({
        date: today,
        book: verseRef.book,
        chapter: verseRef.chapter,
        verse_number: verseRef.verse_number,
        version: verseRef.version,
        language_code: data.language_code,
        text: data.text, // Novo campo
    }));

    // 5. Inserir/Atualizar na tabela daily_verse
    // Primeiro, deletamos entradas antigas para o dia de hoje (se houver)
    await supabase.from('daily_verse').delete().eq('date', today);

    // Depois, inserimos as novas entradas
    const { error: insertError } = await supabase
        .from('daily_verse')
        .insert(insertRows);

    if (insertError) {
        console.error("Failed to insert daily verses:", insertError);
        return new Response(JSON.stringify({ error: "Failed to insert daily verses." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ 
      message: "Daily verse updated and translated successfully.",
      languages: allVerseData.map(d => d.language_code),
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