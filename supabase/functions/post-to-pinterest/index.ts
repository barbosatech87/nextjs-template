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

async function logEvent(supabase, automationId, original_post_id, status, message, details = {}) {
  const { error } = await supabase.from('social_media_post_logs').insert({
    automation_id: automationId,
    original_post_id: original_post_id,
    status,
    message,
    details,
  });
  if (error) console.error(`Failed to log event:`, error.message);
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

async function postToPinterest(boardId, link, title, description, imageUrl) {
  const accessToken = Deno.env.get("PINTEREST_ACCESS_TOKEN");
  if (!accessToken) throw new Error("PINTEREST_ACCESS_TOKEN is not set.");

  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      board_id: boardId,
      link: link,
      title: title,
      alt_text: title,
      description: description,
      media_source: {
        source_type: "image_url",
        url: imageUrl,
      },
    }),
  });

  if (!response.ok) throw new Error(`Pinterest API error: ${await response.text()}`);
  const data = await response.json();
  return data.id;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let automationId = null;
  let postId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("automationId is required.");

    await logEvent(supabase, automationId, null, 'processing', 'Iniciando postagem no Pinterest.');

    const { data: automation, error: autoError } = await supabase.from('social_media_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automation rule not found: ${autoError?.message}`);
    if (!automation.is_active) {
      await logEvent(supabase, automationId, null, 'success', 'Automação inativa, execução pulada.');
      return new Response(JSON.stringify({ message: "Automation is not active." }), { headers: corsHeaders });
    }

    const post = await getUnpostedBlogPost(supabase, automation);
    if (!post) {
      await logEvent(supabase, automationId, null, 'success', 'Nenhum post novo para publicar.');
      return new Response(JSON.stringify({ message: "No new posts to publish." }), { headers: corsHeaders });
    }
    postId = post.id; // Armazena o ID do post para logs de erro

    const pinDescription = await generatePinContent(automation.description_template, post);
    const pinImageUrl = await generateAndUploadImage(automation.image_prompt_template, post, supabase);
    const postUrl = `https://www.paxword.com/pt/blog/${post.slug}`;

    const pinId = await postToPinterest(automation.pinterest_board_id, postUrl, post.title, pinDescription, pinImageUrl);

    await logEvent(supabase, automationId, postId, 'success', `Pin criado com sucesso: ${pinId}`, { pinId });

    return new Response(JSON.stringify({ message: "Successfully posted to Pinterest.", pinId }), { headers: corsHeaders });

  } catch (error) {
    console.error("Edge Function Error:", error);
    if (automationId) {
      await logEvent(supabase, automationId, postId, 'error', error.message, { stack: error.stack });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});