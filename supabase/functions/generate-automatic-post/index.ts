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

// --- FUNÇÃO DE LOG ---
async function logAutomationEvent(supabase, scheduleId, status, message, details = {}) {
  try {
    const { error } = await supabase.from('automation_logs').insert({
      schedule_id: scheduleId,
      status,
      message,
      details,
    });
    if (error) {
      console.error(`[FATAL] Failed to log automation event:`, error.message);
    }
  } catch (logError) {
    console.error(`[FATAL] Exception during logging:`, logError.message);
  }
}


// --- FUNÇÕES DE IA E UTILITÁRIOS ---

async function generateDraftWithOpenAI(postType, context) {
  const systemPrompt = `Você é um assistente de IA para um blog cristão. Gere um rascunho de post em formato Markdown baseado no tipo e contexto fornecidos. O idioma deve ser português do Brasil. Foque apenas no corpo do texto. Não inclua um título principal (H1). Comece diretamente com o primeiro parágrafo ou um subtítulo (H2).`;
  
  let userPrompt = "";
  switch (postType) {
    case 'thematic':
      userPrompt = `Gere um rascunho de post de estudo bíblico aprofundado sobre o tema: "${context.theme}". Use versículos bíblicos relevantes para embasar o conteúdo.`;
      break;
    case 'summary':
      userPrompt = `Gere um rascunho de resumo detalhado e reflexivo do capítulo ${context.verse.chapter} do livro de ${context.verse.book}.`;
      break;
    case 'devotional':
    default:
      userPrompt = `Gere um rascunho de post devocional para o versículo: ${context.verse.book} ${context.verse.chapter}:${context.verse.verse_number} - "${context.verse.text}".`;
      break;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function createFinalPostWithClaude(draftContent) {
  const systemPrompt = `Você é um editor teológico e especialista em SEO para conteúdo cristão. Sua tarefa é pegar um rascunho de post em Markdown e transformá-lo em um artigo completo e otimizado.

Sua saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título atrativo e otimizado para SEO com no máximo 70 caracteres.",
  "slug": "um-slug-para-url-baseado-no-titulo-sem-acentos-e-com-hifens",
  "content": "O corpo do post em formato Markdown, refinado para ter um tom pessoal, envolvente e teologicamente sólido. Otimize para SEO, usando subtítulos (H2, H3) e palavras-chave relevantes. Não inclua o título principal (H1) aqui.",
  "summary": "Um resumo conciso do post com no máximo 300 caracteres.",
  "seo_title": "Um título para SEO, similar ao título principal, com no máximo 60 caracteres.",
  "seo_description": "Uma meta descrição para SEO, otimizada para cliques, com no máximo 160 caracteres."
}

Instruções para o refinamento do conteúdo:
1.  Reescreva o texto com um tom altamente pessoal e envolvente, falando diretamente ao leitor.
2.  Melhore a profundidade teológica, a clareza e o tom inspirador.
3.  Garanta que a estrutura do conteúdo seja clara, usando subtítulos (H2, H3) e listas quando apropriado.`;
  
  const userPrompt = `Refine este rascunho e crie o JSON completo:\n\n${draftContent}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("CLAUDE_API_KEY"), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${await response.text()}`);
  const data = await response.json();
  const jsonString = data.content[0].text;

  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude did not return a valid JSON object.");
  }
  
  return JSON.parse(jsonMatch[0]);
}

// NOVA FUNÇÃO: Diretor de Arte de IA
async function generateImagePromptWithAI(postType, postContent, theme) {
  const stylePrompts = {
    devotional: "Crie um prompt para uma imagem de estilo suave, inspirador e contemplativo. Use elementos simbólicos ou abstratos que representem paz, reflexão e esperança. Evite imagens literais ou muito complexas. O estilo pode ser Realismo suave. Nunca utilize textos ou qualquer tipografia.",
    thematic: "Crie um prompt para uma imagem conceitual e forte, que represente o tema central do estudo. Pode incluir elementos históricos, simbologia mais direta ou uma composição artística que provoque o pensamento. Estilos como pintura a óleo digital, arte conceitual ou fotografia dramática são adequados. Nunca utilize textos ou qualquer tipografia.",
    summary: "Crie um prompt que descreva uma cena representativa do capítulo bíblico resumido. O estilo deve ser ilustrativo, como uma pintura digital ou uma gravura, capturando um momento chave da narrativa de forma respeitosa e artística. Nunca utilize textos ou qualquer tipografia."
  };

  const styleInstruction = stylePrompts[postType] || stylePrompts.devotional;

  const systemPrompt = `Você é um diretor de arte de um blog cristão. Sua tarefa é criar um prompt de imagem para DALL-E 3 baseado no conteúdo de um post. O prompt deve ser em inglês, detalhado, e seguir as instruções de estilo fornecidas. O prompt deve descrever uma imagem que seja conceitual, artística e evite representações literais de figuras bíblicas, a menos que seja uma cena narrativa clara. O prompt final deve ter no máximo 250 caracteres. Retorne APENAS o texto do prompt, nada mais.`;

  const userPrompt = `
    **Instrução de Estilo:**
    ${styleInstruction}

    **Conteúdo do Post:**
    - Título: ${postContent.title}
    - Resumo: ${postContent.summary}
    - Tema (se aplicável): ${theme || 'N/A'}
    - Corpo (trecho): ${postContent.content.substring(0, 500)}...

    Baseado no conteúdo e na instrução de estilo, gere o prompt para a imagem.
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      temperature: 0.6,
      max_tokens: 100,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI Prompt Generation API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content.trim().replace(/"/g, ''); // Limpa aspas
}


async function generateImageAndUpload(prompt, userId, supabase) {
  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: "dall-e-3", prompt: prompt, n: 1, size: "1024x1024", response_format: "url" }),
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

  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    console.error("Unauthorized: Missing or incorrect internal secret.");
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let scheduleId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    scheduleId = body.scheduleId;
    if (!scheduleId) {
      throw new Error("scheduleId is required in the request body.");
    }

    console.log(`[LOG] Starting automatic post generation for scheduleId: ${scheduleId}`);

    const { data: schedule, error: scheduleError } = await supabase.from('automatic_post_schedules').select('*').eq('id', scheduleId).single();
    if (scheduleError || !schedule) throw new Error(`Error fetching schedule ${scheduleId}: ${scheduleError?.message || 'Not found.'}`);
    if (!schedule.is_active) {
        console.log(`[LOG] Schedule ${scheduleId} is not active. Skipping.`);
        await logAutomationEvent(supabase, scheduleId, 'success', 'Agendamento inativo, execução pulada.');
        return new Response(JSON.stringify({ message: "Schedule is not active." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
    console.log(`[LOG] Processing schedule: ${schedule.name}`);

    let context = {};
    if (schedule.post_type === 'thematic') {
        if (!schedule.theme) throw new Error(`Theme is required for thematic post type on schedule ${schedule.id}`);
        context.theme = schedule.theme;
    } else if (schedule.post_type === 'devotional' || schedule.post_type === 'summary') {
        const { data: verse, error: verseError } = await supabase.rpc('get_unused_verse_for_schedule', { p_schedule_id: schedule.id }).single();
        if (verseError || !verse) {
            throw new Error(`Could not get unused verse for schedule ${schedule.id}: ${verseError?.message || 'No verse available.'}`);
        }
        context.verse = verse;
        console.log(`[LOG] Selected verse for ${schedule.post_type}: ${verse.book} ${verse.chapter}:${verse.verse_number}`);
    } else {
        throw new Error(`Unsupported post_type: ${schedule.post_type}`);
    }

    const initialDraft = await generateDraftWithOpenAI(schedule.post_type, context);
    console.log(`[LOG] Draft generated by OpenAI.`);

    const draftPost = await createFinalPostWithClaude(initialDraft);
    console.log(`[LOG] Post finalized by Claude: "${draftPost.title}"`);

    // LÓGICA DE GERAÇÃO DE PROMPT DE IMAGEM
    let finalImagePrompt;
    if (schedule.default_image_prompt && schedule.default_image_prompt.trim() !== '') {
        finalImagePrompt = `${schedule.default_image_prompt}. Artistic and conceptual style, without any text or typography.`;
        console.log(`[LOG] Using user-provided image prompt, refined for DALL-E.`);
    } else {
        console.log(`[LOG] Generating image prompt with AI Art Director...`);
        finalImagePrompt = await generateImagePromptWithAI(schedule.post_type, draftPost, schedule.theme);
        console.log(`[LOG] AI-generated image prompt: "${finalImagePrompt}"`);
    }

    const imageUrl = await generateImageAndUpload(finalImagePrompt, schedule.author_id, supabase);
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

    if (schedule.category_ids && schedule.category_ids.length > 0) {
        const postCategories = schedule.category_ids.map(catId => ({ post_id: newPost.id, category_id: catId }));
        const { error: catError } = await supabase.from('blog_post_categories').insert(postCategories);
        if (catError) console.error(`[ERROR] Failed to associate categories for post ${newPost.id}:`, catError.message);
        else console.log(`[LOG] Associated ${postCategories.length} categories to post ${newPost.id}.`);
    }

    if ((schedule.post_type === 'devotional' || schedule.post_type === 'summary') && context.verse) {
        const { error: usedVerseError } = await supabase.from('used_verses_for_automation').insert({
          schedule_id: schedule.id,
          verse_id: context.verse.id,
        });
        if (usedVerseError) throw new Error(`Failed to mark verse as used: ${usedVerseError.message}`);
        console.log("[LOG] Verse marked as used.");
    }

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

    await logAutomationEvent(supabase, scheduleId, 'success', `Post "${draftPost.title}" criado com sucesso.`);

    return new Response(JSON.stringify({ message: "Automatic post created and translation initiated.", postId: newPost.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error) {
    console.error("[FATAL] Edge Function Error:", error);
    await logAutomationEvent(supabase, scheduleId, 'error', error.message, { stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});