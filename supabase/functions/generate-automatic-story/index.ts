// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// --- FUNÇÕES DE LOG ---
async function createLog(supabase, automationId, status, message, details = {}, storyId = null) {
  const { data, error } = await supabase.from('story_automation_logs').insert({
    automation_id: automationId,
    story_id: storyId,
    status,
    message,
    details,
  }).select('id').single();
  if (error) console.error(`[FATAL] Failed to create log:`, error.message);
  return data?.id;
}

async function updateLog(supabase, logId, status, message, detailsUpdate = {}, storyId = null) {
  if (!logId) return;
  const { data: currentLog } = await supabase.from('story_automation_logs').select('details').eq('id', logId).single();
  const newDetails = { ...(currentLog?.details || {}), ...detailsUpdate };
  
  const updatePayload = { status, message, details: newDetails };
  if (storyId) {
    updatePayload.story_id = storyId;
  }

  await supabase.from('story_automation_logs').update(updatePayload).eq('id', logId);
}

// --- FUNÇÕES DE IA (REPLICATE) ---

async function generateStoryPagesWithReplicate(postTitle, postSummary, pageCount) {
    const systemPrompt = `You are an AI expert creating Web Stories for a Christian blog. Transform a blog post into a concise, ${pageCount}-page story.
    
    RULES:
    1.  Each page needs a background image prompt and short text (max 25 words). Use HTML tags like <strong>.
    2.  Image prompts must be descriptive, artistic, symbolic, and suitable for the 'flux-schnell' model. No text in image prompts.
    3.  The story must flow logically, summarizing the article's key points.
    4.  Your output MUST be a valid JSON object: { "pages": [ { "text": "...", "image_prompt": "..." }, ... ] }`;

    const userPrompt = `Article Title: ${postTitle}\nArticle Summary: ${postSummary}\n\nCreate a ${pageCount}-page Web Story.`;

    const initResponse = await fetch("https://api.replicate.com/v1/models/openai/gpt-4o-mini/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: {
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                prompt_template: "<s>[INST] {prompt} [/INST] ",
            },
        }),
    });

    if (!initResponse.ok) throw new Error(`Replicate Text Init Error: ${await initResponse.text()}`);
    const prediction = await initResponse.json();
    const pollingUrl = prediction.urls.get;

    let finalPrediction;
    for (let i = 0; i < 20; i++) { // Timeout ~40 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(pollingUrl, {
            headers: { "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}` }
        });
        finalPrediction = await pollResponse.json();
        if (finalPrediction.status === 'succeeded') break;
        if (finalPrediction.status === 'failed') throw new Error(`Replicate Text Gen Failed: ${finalPrediction.error}`);
    }

    if (finalPrediction?.status !== 'succeeded' || !finalPrediction.output) {
        throw new Error("Replicate text generation timed out or failed to produce output.");
    }

    const rawOutput = finalPrediction.output.join('');
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AI did not return a valid JSON object in its response.");
    }
    const jsonString = jsonMatch[0];
    const content = JSON.parse(jsonString);

    if (!content.pages || !Array.isArray(content.pages)) throw new Error("AI did not return a valid 'pages' array in the JSON object.");
    return content.pages;
}

async function generateAndUploadImageWithReplicate(prompt, supabase) {
    const initResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "black-forest-labs/flux-schnell",
            input: {
                prompt: prompt,
                width: 1024,
                height: 1792,
                num_inference_steps: 10,
            },
        }),
    });

    if (!initResponse.ok) {
        const errorBody = await initResponse.json();
        if (initResponse.status === 429) {
            // Se for erro de rate limit, espera o tempo sugerido e tenta de novo
            const retryAfter = errorBody.retry_after || 5; // Padrão de 5 segundos
            console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return generateAndUploadImageWithReplicate(prompt, supabase); // Tenta novamente
        }
        throw new Error(`Replicate Image Init Error: ${errorBody.detail || 'Unknown error'}`);
    }
    const prediction = await initResponse.json();
    const pollingUrl = prediction.urls.get;

    let finalPrediction;
    for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(pollingUrl, {
            headers: { "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}` }
        });
        finalPrediction = await pollResponse.json();
        if (finalPrediction.status === 'succeeded') break;
        if (finalPrediction.status === 'failed') throw new Error(`Replicate Image Gen Failed: ${finalPrediction.error}`);
    }

    const tempUrl = finalPrediction?.output?.[0];
    if (!tempUrl) throw new Error("Image URL not returned by Replicate.");

    const imageRes = await fetch(tempUrl);
    if (!imageRes.ok) throw new Error("Failed to download generated image from Replicate.");
    
    const arrayBuffer = await imageRes.arrayBuffer();
    const filePath = `web-stories/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage.from("blog_images").upload(filePath, arrayBuffer, { contentType: 'image/png', cacheControl: '31536000, immutable' });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(filePath);
    return publicUrlData.publicUrl;
}

// --- FUNÇÃO PRINCIPAL ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  let logId = null;
  let automationId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  try {
    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error('Missing automationId');

    logId = await createLog(supabase, automationId, 'processing', 'Iniciando automação de story...');

    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automação não encontrada: ${autoError?.message || 'Not found.'}`);
    if (!automation.is_active) {
      await updateLog(supabase, logId, 'success', 'Automação inativa, execução pulada.');
      return new Response(JSON.stringify({ message: "Automation is not active." }), { headers: corsHeaders });
    }

    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automationId }).single();
    if (postError || !post) throw new Error(`Nenhum post novo encontrado. ${postError?.message || ''}`);
    await updateLog(supabase, logId, 'processing', `Post encontrado: "${post.title}"`);

    const storyPagesContent = await generateStoryPagesWithReplicate(post.title, post.summary, automation.number_of_pages);
    await updateLog(supabase, logId, 'processing', 'Conteúdo das páginas gerado pela IA (Replicate).');

    const finalPages = [];
    for (const [index, pageContent] of storyPagesContent.entries()) {
      await updateLog(supabase, logId, 'processing', `Gerando imagem para a página ${index + 1} (Replicate)...`);
      
      // Pausa de 1 segundo entre as requisições de imagem para respeitar o rate limit
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const imageUrl = await generateAndUploadImageWithReplicate(pageContent.image_prompt, supabase);
      
      const page = {
        id: crypto.randomUUID(),
        backgroundSrc: imageUrl,
        backgroundType: 'image',
        elements: [{
          id: crypto.randomUUID(),
          type: 'text',
          content: pageContent.text,
          style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '28px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px', textAlign: 'center', width: '85%' }
        }]
      };
      
      if (automation.add_post_link_on_last_page && index === storyPagesContent.length - 1) {
        page.outlink = { href: `https://www.paxword.com/pt/blog/${post.slug}`, ctaText: 'Leia o Artigo' };
      }
      finalPages.push(page);
    }
    await updateLog(supabase, logId, 'processing', 'Imagens geradas e enviadas.');

    const posterImageUrl = finalPages[0].backgroundSrc;
    const slug = post.slug + '-story';
    const status = automation.publish_automatically ? 'published' : 'draft';
    const published_at = automation.publish_automatically ? new Date().toISOString() : null;

    const { data: newStory, error: storyInsertError } = await supabase.from('web_stories').insert({
      author_id: post.author_id, title: post.title, slug,
      story_data: { pages: finalPages }, poster_image_src: posterImageUrl,
      status, published_at, language_code: 'pt',
    }).select('id').single();

    if (storyInsertError) throw new Error(`Falha ao salvar a story: ${storyInsertError.message}`);
    await updateLog(supabase, logId, 'processing', `Story salva com ID: ${newStory.id}.`, {}, newStory.id);

    const { error: usedPostError } = await supabase.from('used_posts_for_stories').insert({ automation_id: automationId, post_id: post.id });
    if (usedPostError) throw new Error(`Falha ao marcar post como usado: ${usedPostError.message}`);

    if (status === 'published') {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-web-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': Deno.env.get('INTERNAL_SECRET_KEY') },
        body: JSON.stringify({ storyId: newStory.id, title: post.title, storyData: { pages: finalPages } }),
      }).catch(err => console.error(`[ERROR] Falha ao disparar tradução:`, err));
    }

    await updateLog(supabase, logId, 'success', `Story "${post.title}" gerada com sucesso.`);
    
    return new Response(JSON.stringify({ success: true, storyId: newStory.id }), { headers: corsHeaders });

  } catch (error) {
    console.error("FATAL ERROR:", error);
    if (logId) {
      await updateLog(supabase, logId, 'error', error.message, { stack: error.stack });
    } else {
      await createLog(supabase, automationId, 'error', error.message, { stack: error.stack });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});