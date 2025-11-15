// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Declarações de tipos para Deno/ESM
declare const Deno: any;
declare const Request: any;
declare const Response: any;

// Cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- FUNÇÕES DE IA ---

async function generateDraftWithOpenAI(verse) {
  const systemPrompt = `Você é um assistente de IA para um blog cristão. Gere um post devocional baseado no versículo fornecido. O idioma deve ser português do Brasil. A saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
  "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
  "content": "O corpo do post em formato Markdown, com pelo menos 3 parágrafos. Não inclua o título principal (H1) no conteúdo.",
  "summary": "Um resumo conciso do post com no máximo 300 caracteres.",
  "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
  "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
}`;
  const userPrompt = `Gere um post devocional para o versículo: ${verse.book} ${verse.chapter}:${verse.verse_number} - "${verse.text}".`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function refineContentWithClaude(content) {
  const systemPrompt = `Você é um editor teológico especialista. Refine o rascunho de post devocional a seguir para melhorar sua profundidade teológica, clareza e tom inspirador. Mantenha o formato Markdown e a estrutura geral. Retorne APENAS o conteúdo Markdown refinado do corpo do post, nada mais.`;
  const userPrompt = `Refine este rascunho de conteúdo:\n\n${content}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("CLAUDE_API_KEY"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: systemPrompt }, // Claude 3.5 prefere o system prompt como uma mensagem do assistente
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}


// --- FUNÇÃO PRINCIPAL ---

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 1. Busca o primeiro agendamento ativo.
    const { data: schedule, error: scheduleError } = await supabase
      .from('automatic_post_schedules')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      throw new Error(`Não foi possível buscar um agendamento ativo: ${scheduleError.message}`);
    }

    if (!schedule) {
      return new Response(JSON.stringify({ message: "Nenhum agendamento ativo encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }
    console.log(`Processando agendamento: ${schedule.name}`);

    // 2. Selecionar um versículo único para este agendamento.
    const { data: verse, error: verseError } = await supabase
      .rpc('get_unused_verse_for_schedule', { p_schedule_id: schedule.id })
      .single();

    if (verseError || !verse) {
      throw new Error(`Não foi possível obter um versículo não utilizado para o agendamento ${schedule.id}: ${verseError?.message || 'Nenhum versículo disponível.'}`);
    }
    console.log(`Versículo selecionado: ${verse.book} ${verse.chapter}:${verse.verse_number}`);

    // 3. Chamar a IA para gerar o rascunho do post.
    const draftPost = await generateDraftWithOpenAI(verse);
    console.log(`Rascunho gerado pela OpenAI para o título: "${draftPost.title}"`);

    // 4. Chamar a IA para refinar o post.
    const refinedContent = await refineContentWithClaude(draftPost.content);
    draftPost.content = refinedContent;
    console.log("Conteúdo refinado pelo Claude.");

    // TODO nas próximas etapas:
    // 5. Chamar a IA para gerar a imagem.
    // 6. Salvar o post no banco de dados.
    // 7. Disparar a função de tradução.

    return new Response(JSON.stringify({ 
      message: "Rascunho de post gerado e refinado com sucesso.",
      schedule_name: schedule.name,
      generated_post: draftPost, // Retornando o post para debug
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});