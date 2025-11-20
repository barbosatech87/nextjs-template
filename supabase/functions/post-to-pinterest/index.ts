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

// Cria o log inicial e retorna o ID para passarmos ao n8n
async function createInitialLog(supabase, automationId, original_post_id, message, details = {}) {
  const { data, error } = await supabase.from('social_media_post_logs').insert({
    automation_id: automationId,
    original_post_id: original_post_id,
    status: 'processing', // Começa como processing até o n8n confirmar
    message,
    details,
  }).select('id').single();
  
  if (error) {
    console.error(`Failed to create log:`, error.message);
    throw error;
  }
  return data.id;
}

// Função de fallback para atualizar log em caso de erro fatal no script (antes de enviar pro n8n)
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

async function generateAndUploadImage(promptTemplate, post, supabase) {
  const filledPrompt = promptTemplate
    .replace('{post_title}', post.title)
    .replace('{post_summary}', post.summary || '');

  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: "dall-e-3", prompt: filledPrompt, n: 1, size: "1024x1792", response_format: "url" }),
  });
  if (!openaiResponse.ok) throw new Error(`OpenAI image generation failed: ${await openaiResponse.text()}`);
  const data = await openaiResponse.json();
  const tempUrl = data.data?.[0]?.url;
  if (!tempUrl) throw new Error("Image URL not returned by OpenAI.");

  const imageRes = await fetch(tempUrl);
  if (!imageRes.ok) throw new Error("Failed to download generated image.");
  
  const arrayBuffer = await imageRes.arrayBuffer();
  const filePath = `social-automation/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage.from("blog_images").upload(filePath, arrayBuffer, { contentType: 'image/png' });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

async function sendToN8n(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to send to n8n: ${response.statusText}`);
  }
  return true;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Verifica autorização interna (cron ou chamada manual do admin)
  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
  if (!n8nWebhookUrl) {
    return new Response(JSON.stringify({ error: "Configuration Error: N8N_WEBHOOK_URL is not set." }), { status: 500, headers: corsHeaders });
  }

  let automationId = null;
  let logId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("automationId is required.");

    // 1. Validar Automação
    const { data: automation, error: autoError } = await supabase.from('social_media_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automation rule not found: ${autoError?.message}`);
    
    if (!automation.is_active) {
      return new Response(JSON.stringify({ message: "Automation is not active." }), { headers: corsHeaders });
    }

    // 2. Encontrar Post
    const post = await getUnpostedBlogPost(supabase, automation);
    if (!post) {
      return new Response(JSON.stringify({ message: "No new posts to publish." }), { headers: corsHeaders });
    }

    // 3. Gerar Conteúdo
    const pinDescription = await generatePinContent(automation.description_template, post);
    const pinImageUrl = await generateAndUploadImage(automation.image_prompt_template, post, supabase);
    const postUrl = `https://www.paxword.com/pt/blog/${post.slug}`;

    // 4. Criar Log Inicial (Status: Processing)
    logId = await createInitialLog(
      supabase, 
      automationId, 
      post.id, 
      'Conteúdo gerado. Enviando para n8n...', 
      { 
        generatedDescription: pinDescription, 
        generatedImageUrl: pinImageUrl,
        targetUrl: postUrl
      }
    );

    // 5. Enviar para n8n
    const n8nPayload = {
      logId: logId, // Importante: o n8n deve devolver isso no callback
      boardId: automation.pinterest_board_id,
      title: post.title,
      description: pinDescription,
      link: postUrl,
      imageUrl: pinImageUrl,
      // Passamos o segredo para o n8n autenticar o callback de volta
      callbackSecret: Deno.env.get('INTERNAL_SECRET_KEY') 
    };

    await sendToN8n(n8nWebhookUrl, n8nPayload);

    // 6. Atualizar mensagem do log (o status continua processing até o callback)
    await supabase.from('social_media_post_logs').update({
      message: 'Enviado ao n8n. Aguardando confirmação de postagem.'
    }).eq('id', logId);

    return new Response(JSON.stringify({ message: "Sent to n8n for processing.", logId }), { headers: corsHeaders });

  } catch (error) {
    console.error("Edge Function Error:", error);
    // Se já tivermos um log criado, atualizamos para erro. Se não, não temos onde logar no banco (apenas console).
    if (logId) {
      await updateLogToError(supabase, logId, `Erro interno antes do envio ao n8n: ${error.message}`);
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});