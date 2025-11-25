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

// Cria o log inicial e retorna o ID para passarmos a Make
async function createInitialLog(supabase, automationId, original_post_id, message, details = {}) {
  const { data, error } = await supabase.from('social_media_post_logs').insert({
    automation_id: automationId,
    original_post_id: original_post_id,
    status: 'processing', // Começa como processing até a Make confirmar
    message,
    details,
  }).select('id').single();
  
  if (error) {
    console.error(`Failed to create log:`, error.message);
    throw error;
  }
  return data.id;
}

// Função de fallback para atualizar log em caso de erro fatal no script
async function updateLogToError(supabase, logId, message) {
  if (!logId) return;
  await supabase.from('social_media_post_logs').update({
    status: 'error',
    message: message
  }).eq('id', logId);
}

async function getUnpostedBlogPost(supabase, automation) {
  let query = supabase
    .from('blog_posts')
    .select('id, title, summary, slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (automation.source_category_id) {
    const { data: postIds, error: catError } = await supabase
      .from('blog_post_categories')
      .select('post_id')
      .eq('category_id', automation.source_category_id);
    if (catError) throw new Error(`Failed to get posts for category: ${catError.message}`);
    query = query.in('id', postIds.map(p => p.post_id));
  }

  const { data: posts, error: postsError } = await query.limit(50);
  if (postsError) throw new Error(`Failed to fetch blog posts: ${postsError.message}`);

  const { data: loggedPosts, error: logError } = await supabase
    .from('social_media_post_logs')
    .select('original_post_id')
    .eq('automation_id', automation.id);
  if (logError) throw new Error(`Failed to fetch logs: ${logError.message}`);

  const postedIds = new Set(loggedPosts.map(l => l.original_post_id));
  return posts.find(p => !postedIds.has(p.id));
}

async function generatePinContent(template, post) {
  const filledTemplate = template
    .replace('{post_title}', post.title)
    .replace('{post_summary}', post.summary || '');

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um especialista em marketing para Pinterest. Crie uma descrição curta e atrativa para um Pin baseado no texto a seguir. Use hashtags relevantes. Retorne apenas a descrição." },
        { role: "user", content: filledTemplate },
      ],
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI text generation failed: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateImagePrompt(postTitle, postSummary) {
  const systemPrompt = `Você é um criador de prompts de imagem para DALL-E 3. Sua tarefa é criar um prompt de imagem único, conceitual e artístico, baseado no título e resumo do artigo fornecido. O estilo deve ser aquarela minimalista e suave. O prompt deve ter no máximo 150 palavras. Não inclua texto, letras ou números. Foque em simbolismo cristão e cores calmas. Retorne APENAS o prompt de imagem.`;
  
  const userPrompt = `Título: ${postTitle}\nResumo: ${postSummary}`;

  try {
    if (!Deno.env.get("CLAUDE_API_KEY")) {
      throw new Error("CLAUDE_API_KEY not set. Falling back to OpenAI.");
    }
    
    const model = "claude-sonnet-4-5-20250929";
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("CLAUDE_API_KEY"), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${await response.text()}`);
    const data = await response.json();
    return data.content[0].text.trim();

  } catch (claudeError) {
    console.warn(`Claude failed to generate image prompt: ${claudeError.message}. Falling back to OpenAI GPT-4o-mini.`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}

async function generateAndUploadImage(promptTemplate, post, supabase) {
  const dynamicImagePrompt = await generateImagePrompt(post.title, post.summary);
  
  const finalPrompt = `High-quality, artistic, conceptual image for a Christian blog post. No text, letters, or numbers. Prompt: ${dynamicImagePrompt}`;
  
  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: "dall-e-3", prompt: finalPrompt, n: 1, size: "1024x1792", response_format: "url" }),
  });
  if (!openaiResponse.ok) throw new Error(`OpenAI image generation failed: ${await openaiResponse.text()}`);
  const data = await openaiResponse.json();
  const tempUrl = data.data?.[0]?.url;
  if (!tempUrl) throw new Error("Image URL not returned by OpenAI.");

  const imageRes = await fetch(tempUrl);
  if (!imageRes.ok) throw new Error("Failed to download generated image.");
  
  const arrayBuffer = await imageRes.arrayBuffer();
  const filePath = `social-automation/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage.from("blog_images").upload(filePath, arrayBuffer, { 
    contentType: 'image/png',
    cacheControl: '31536000, immutable' // Cache de 1 ano
  });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(filePath);
  return { imageUrl: publicUrlData.publicUrl, usedPrompt: dynamicImagePrompt };
}

async function sendToMake(webhookUrl, apiKey, payload) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Adiciona o header de API Key se fornecido
  if (apiKey) {
    headers['x-make-apikey'] = apiKey;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to send to Make: ${response.statusText} (${response.status})`);
  }
  
  // Make webhooks sometimes return text "Accepted" or JSON
  return true;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Configurações da Make
  const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");
  const makeApiKey = Deno.env.get("MAKE_API_KEY");

  if (!makeWebhookUrl) {
    return new Response(JSON.stringify({ error: "Configuration Error: MAKE_WEBHOOK_URL is not set." }), { status: 500, headers: corsHeaders });
  }

  let automationId = null;
  let logId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("automationId is required.");

    const { data: automation, error: autoError } = await supabase.from('social_media_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automation rule not found: ${autoError?.message}`);
    
    if (!automation.is_active) {
      return new Response(JSON.stringify({ message: "Automation is not active." }), { headers: corsHeaders });
    }

    const post = await getUnpostedBlogPost(supabase, automation);
    if (!post) {
      return new Response(JSON.stringify({ message: "No new posts to publish." }), { headers: corsHeaders });
    }

    // Geração de conteúdo
    const pinDescription = await generatePinContent(automation.description_template, post);
    const { imageUrl: pinImageUrl, usedPrompt } = await generateAndUploadImage(automation.image_prompt_template, post, supabase);
    const postUrl = `https://www.paxword.com/pt/blog/${post.slug}`;

    // Cria o log inicial
    logId = await createInitialLog(
      supabase, 
      automationId, 
      post.id, 
      'Conteúdo gerado. Enviando para Make...', 
      { 
        generatedDescription: pinDescription, 
        generatedImageUrl: pinImageUrl,
        imagePrompt: usedPrompt,
        targetUrl: postUrl,
        targetPlatform: 'make'
      }
    );

    // Payload para a Make
    const makePayload = {
      logId: logId,
      boardId: automation.pinterest_board_id, // Importante: ID do board do Pinterest
      title: post.title,
      description: pinDescription,
      link: postUrl,
      imageUrl: pinImageUrl,
      callbackSecret: Deno.env.get('INTERNAL_SECRET_KEY') 
    };

    await sendToMake(makeWebhookUrl, makeApiKey, makePayload);

    await supabase.from('social_media_post_logs').update({
      message: 'Enviado para Make. Aguardando callback.'
    }).eq('id', logId);

    return new Response(JSON.stringify({ message: "Sent to Make for processing.", logId }), { headers: corsHeaders });

  } catch (error) {
    console.error("Edge Function Error:", error);
    if (logId) {
      await updateLogToError(supabase, logId, `Erro interno antes do envio para Make: ${error.message}`);
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});