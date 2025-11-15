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

// --- FUNÇÕES DE IA E UTILITÁRIOS ---

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
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function refineContentWithClaude(content) {
  const systemPrompt = `Você é um editor teológico especialista. Refine o rascunho de post devocional a seguir para melhorar sua profundidade teológica, clareza e tom inspirador. Mantenha o formato Markdown e a estrutura geral. Retorne APENAS o conteúdo Markdown refinado do corpo do post, nada mais.`;
  const userPrompt = `Refine este rascunho de conteúdo:\n\n${content}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("CLAUDE_API_KEY"), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }, { role: "assistant", content: systemPrompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${await response.text()}`);
  const data = await response.json();
  return data.content[0].text;
}

async function generateImageAndUpload(prompt, userId, supabase) {
  const fullPrompt = `High-quality, artistic, conceptual image for a Christian blog post. Abstract or symbolic representation. No text, letters, or numbers. Theme: ${prompt}`;
  
  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: "dall-e-3", prompt: fullPrompt, n: 1, size: "1024x1024", response_format: "url" }),
  });

  if (!openaiResponse.ok) throw new Error(`OpenAI Image API error: ${await openaiResponse.text()}`);
  const data = await openaiResponse.json();
  const temporaryUrl = data.data?.[0]?.url;
  if (!temporaryUrl) throw new Error("Image URL not returned by OpenAI.");

  const imageRes = await fetch(temporaryUrl);
  if (!imageRes.ok) throw new Error("Failed to download generated image.");
  
  const contentType = imageRes.headers.get("content-type") || "image/png";
  const arrayBuffer = await imageRes.arrayBuffer();
  const fileName = `${crypto.randomUUID()}.png`;
  const filePath = `generated/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from("blog_images").upload(filePath, arrayBuffer, { contentType, upsert: false });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

// --- FUNÇÃO PRINCIPAL ---

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const { data: schedule, error: scheduleError } = await supabase.from('automatic_post_schedules').select('*').eq('is_active', true).limit(1).single();
    if (scheduleError && scheduleError.code !== 'PGRST116') throw new Error(`Error fetching schedule: ${scheduleError.message}`);
    if (!schedule) return new Response(JSON.stringify({ message: "No active schedule found." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    console.log(`Processing schedule: ${schedule.name}`);

    const { data: verse, error: verseError } = await supabase.rpc('get_unused_verse_for_schedule', { p_schedule_id: schedule.id }).single();
    if (verseError || !verse) throw new Error(`Could not get unused verse for schedule ${schedule.id}: ${verseError?.message || 'No verse available.'}`);
    console.log(`Selected verse: ${verse.book} ${verse.chapter}:${verse.verse_number}`);

    const draftPost = await generateDraftWithOpenAI(verse);
    console.log(`Draft generated by OpenAI: "${draftPost.title}"`);

    draftPost.content = await refineContentWithClaude(draftPost.content);
    console.log("Content refined by Claude.");

    const imageUrl = await generateImageAndUpload(schedule.default_image_prompt, schedule.author_id, supabase);
    console.log(`Image generated and uploaded: ${imageUrl}`);

    const { data: newPost, error: postInsertError } = await supabase.from('blog_posts').insert({
      author_id: schedule.author_id,
      title: draftPost.title,
      slug: draftPost.slug,
      content: draftPost.content,
      summary: draftPost.summary,
      image_url: imageUrl,
      image_alt_text: draftPost.title, // Usando o título como alt text padrão
      seo_title: draftPost.seo_title,
      seo_description: draftPost.seo_description,
      status: 'draft', // Salva como rascunho
      language_code: 'pt',
    }).select('id').single();

    if (postInsertError) throw new Error(`Failed to save post: ${postInsertError.message}`);
    console.log(`Post saved as draft with ID: ${newPost.id}`);

    const { error: usedVerseError } = await supabase.from('used_verses_for_automation').insert({
      schedule_id: schedule.id,
      verse_id: verse.id,
    });
    if (usedVerseError) throw new Error(`Failed to mark verse as used: ${usedVerseError.message}`);
    console.log("Verse marked as used.");

    // TODO: Disparar a função de tradução na próxima etapa.

    return new Response(JSON.stringify({ message: "Automatic post created successfully as a draft.", postId: newPost.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});