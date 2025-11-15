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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// --- FUNÇÕES DE IA E UTILITÁRIOS ---

async function generateDraftWithOpenAI(postType, context) {
  const systemPrompt = `Você é um assistente de IA para um blog cristão. Gere um post baseado no tipo e contexto fornecidos. O idioma deve ser português do Brasil. A saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
  "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
  "content": "O corpo do post em formato Markdown, com pelo menos 3 parágrafos. Não inclua o título principal (H1) no conteúdo.",
  "summary": "Um resumo conciso do post com no máximo 300 caracteres.",
  "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
  "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
}`;
  
  let userPrompt = "";
  switch (postType) {
    case 'thematic':
      userPrompt = `Gere um post de estudo bíblico aprofundado sobre o tema: "${context.theme}". Use versículos bíblicos relevantes para embasar o conteúdo.`;
      break;
    case 'summary':
      // Lógica para resumo de capítulo (a ser implementada)
      userPrompt = `Gere um resumo detalhado e reflexivo do capítulo ${context.chapter} do livro de ${context.book}.`;
      break;
    case 'devotional':
    default:
      userPrompt = `Gere um post devocional para o versículo: ${context.verse.book} ${context.verse.chapter}:${context.verse.verse_number} - "${context.verse.text}".`;
      break;
  }

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
  const systemPrompt = `Você é um editor teológico especialista. Refine o rascunho de post a seguir para melhorar sua profundidade teológica, clareza e tom inspirador, com um estilo pessoal e voltado para o público cristão. Otimize o texto para SEO, garantindo que as palavras-chave e a estrutura sejam amigáveis para ranqueamento. Mantenha o formato Markdown e a estrutura geral. Retorne APENAS o conteúdo Markdown refinado do corpo do post, nada mais.`;
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

  // Adicionando verificação de segurança
  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    console.error("Unauthorized: Missing or incorrect internal secret.");
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    const { scheduleId } = await req.json();
    if (!scheduleId) {
      throw new Error("scheduleId is required in the request body.");
    }

    console.log(`[LOG] Starting automatic post generation for scheduleId: ${scheduleId}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const { data: schedule, error: scheduleError } = await supabase.from('automatic_post_schedules').select('*').eq('id', scheduleId).single();
    if (scheduleError || !schedule) throw new Error(`Error fetching schedule ${scheduleId}: ${scheduleError?.message || 'Not found.'}`);
    if (!schedule.is_active) {
        console.log(`[LOG] Schedule ${scheduleId} is not active. Skipping.`);
        return new Response(JSON.stringify({ message: "Schedule is not active." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
    console.log(`[LOG] Processing schedule: ${schedule.name}`);

    let context = {};
    if (schedule.post_type === 'thematic') {
        if (!schedule.theme) throw new Error(`Theme is required for thematic post type on schedule ${schedule.id}`);
        context.theme = schedule.theme;
    } else { // Devocional
        const { data: verse, error: verseError } = await supabase.rpc('get_unused_verse_for_schedule', { p_schedule_id: schedule.id }).single();
        if (verseError || !verse) throw new Error(`Could not get unused verse for schedule ${schedule.id}: ${verseError?.message || 'No verse available.'}`);
        context.verse = verse;
        console.log(`[LOG] Selected verse: ${verse.book} ${verse.chapter}:${verse.verse_number}`);
    }

    const draftPost = await generateDraftWithOpenAI(schedule.post_type, context);
    console.log(`[LOG] Draft generated by OpenAI: "${draftPost.title}"`);

    draftPost.content = await refineContentWithClaude(draftPost.content);
    console.log("[LOG] Content refined by Claude.");

    const imageUrl = await generateImageAndUpload(schedule.default_image_prompt, schedule.author_id, supabase);
    console.log(`[LOG] Image generated and uploaded: ${imageUrl}`);

    const statusToSet = schedule.publish_automatically ? 'published' : 'draft';
    const publishedAt = schedule.publish_automatically ? new Date().toISOString() : null;
    console.log(`[LOG] Post will be saved with status: ${statusToSet}`);

    const { data: newPost, error: postInsertError } = await supabase.from('blog_posts').insert({
      author_id: schedule.author_id,
      title: draftPost.title,
      slug: draftPost.slug,
      content: draftPost.content,
      summary: draftPost.summary,
      image_url: imageUrl,
      image_alt_text: draftPost.title,
      seo_title: draftPost.seo_title,
      seo_description: draftPost.seo_description,
      status: statusToSet,
      published_at: publishedAt,
      language_code: 'pt',
    }).select('id').single();

    if (postInsertError) throw new Error(`Failed to save post: ${postInsertError.message}`);
    console.log(`[LOG] Post saved with ID: ${newPost.id}`);

    // Associar categorias
    if (schedule.category_ids && schedule.category_ids.length > 0) {
        const postCategories = schedule.category_ids.map(catId => ({ post_id: newPost.id, category_id: catId }));
        const { error: catError } = await supabase.from('blog_post_categories').insert(postCategories);
        if (catError) console.error(`[ERROR] Failed to associate categories for post ${newPost.id}:`, catError.message);
        else console.log(`[LOG] Associated ${postCategories.length} categories to post ${newPost.id}.`);
    }

    if (schedule.post_type === 'devotional' && context.verse) {
        const { error: usedVerseError } = await supabase.from('used_verses_for_automation').insert({
          schedule_id: schedule.id,
          verse_id: context.verse.id,
        });
        if (usedVerseError) throw new Error(`Failed to mark verse as used: ${usedVerseError.message}`);
        console.log("[LOG] Verse marked as used.");
    }

    // Disparar a função de tradução (fire and forget)
    const translateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-blog-post`;
    const internalSecret = Deno.env.get("INTERNAL_SECRET_KEY");

    if (internalSecret) {
      fetch(translateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': internalSecret },
        body: JSON.stringify({ postId: newPost.id, title: draftPost.title, summary: draftPost.summary, content: draftPost.content }),
      }).then(res => {
        if (!res.ok) console.error(`[ERROR] Failed to trigger translation for post ${newPost.id}. Status: ${res.status}`);
        else console.log(`[LOG] Translation successfully triggered for post ${newPost.id}.`);
      }).catch(err => console.error(`[ERROR] Error triggering translation for post ${newPost.id}:`, err));
    } else {
      console.warn("[WARN] INTERNAL_SECRET_KEY not set. Skipping automatic translation.");
    }

    return new Response(JSON.stringify({ message: "Automatic post created and translation initiated.", postId: newPost.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    console.error("[FATAL] Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});