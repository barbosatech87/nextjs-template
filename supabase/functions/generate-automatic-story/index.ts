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

// --- FUNÇÕES DE IA (REPLICATE & OPENAI) ---

async function runReplicatePrediction(model, input) {
    const initResponse = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
        method: "POST",
        headers: {
            "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
    });

    if (!initResponse.ok) throw new Error(`Replicate Init Error for ${model}: ${await initResponse.text()}`);
    const prediction = await initResponse.json();
    const pollingUrl = prediction.urls.get;

    for (let i = 0; i < 30; i++) { // Timeout ~60 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(pollingUrl, {
            headers: { "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}` }
        });
        const finalPrediction = await pollResponse.json();
        if (finalPrediction.status === 'succeeded') return finalPrediction.output;
        if (finalPrediction.status === 'failed') throw new Error(`Replicate Gen Failed for ${model}: ${finalPrediction.error}`);
    }

    throw new Error(`Replicate generation timed out for model ${model}.`);
}

async function generateStoryScriptAndStyle(postContent, pageCount) {
    const systemPrompt = `You are an expert editor and creative director for Christian social media. Your task is to read a blog post and create a cohesive plan for a Web Story.

    RULES:
    1.  Distill the article into a narrative arc: a hook, ${pageCount - 2} key points, and a conclusion.
    2.  For each point, write a short, engaging text for a story page (50-200 characters, use simple HTML like <strong>).
    3.  **IMPORTANT: The text content for the pages (inside the "text" field) MUST be written in Portuguese (Brazil), regardless of the input language.**
    4.  Define a single, consistent "visual_style_guide" for the entire story. This guide should describe a minimalist watercolor style, a specific color palette, and recurring symbolic elements.
    5.  **IMPORTANT: The "visual_style_guide" MUST be written in English to be used by image generation models.**
    6.  Your output MUST be a valid JSON object with this exact structure: 
        { 
          "visual_style_guide": "A paragraph describing the consistent visual style (IN ENGLISH).",
          "pages": [ 
            { "text": "Engaging text for page 1 (IN PORTUGUESE)..." },
            { "text": "Engaging text for page 2 (IN PORTUGUESE)..." }
          ] 
        }`;

    const userPrompt = `Article Content:\n\n${postContent}\n\nCreate a ${pageCount}-page Web Story plan based on this article. Remember: Page text in Portuguese, Visual Guide in English.`;

    const output = await runReplicatePrediction("openai/gpt-4o-mini", {
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        prompt_template: "<s>[INST] {prompt} [/INST] ",
    });

    const rawJson = output.join('');
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON for the story plan.");
    const plan = JSON.parse(jsonMatch[0]);

    if (!plan.visual_style_guide || !plan.pages || !Array.isArray(plan.pages)) {
        throw new Error("AI did not return the correct structure for the story plan.");
    }
    return plan;
}

async function generateImagePrompt(visualStyleGuide, pageText) {
    const systemPrompt = `You are a creative assistant that writes image prompts for an AI art generator. Your goal is to combine a consistent style guide with a specific page's text to create a single, effective prompt.

    RULES:
    1.  Adhere strictly to the provided visual style guide.
    2.  Create a symbolic, artistic visual representation of the page text.
    3.  The final prompt must be in English.
    4.  The prompt MUST explicitly state to avoid any kind of text, letters, or numbers.
    5.  Return ONLY the final image prompt as a single string.`;

    const userPrompt = `Visual Style Guide: "${visualStyleGuide}"\n\nPage Text: "${pageText}"`;

    try {
        // Prioridade: Claude 3.5 Sonnet via Replicate
        const output = await runReplicatePrediction("anthropic/claude-4.5-sonnet", {
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            prompt_template: "<s>[INST] {prompt} [/INST] ",
        });
        return output.join('').trim();
    } catch (replicateError) {
        console.warn(`Replicate/Claude failed for image prompt: ${replicateError.message}. Falling back to Claude (Direct API).`);
        
        // Fallback: Claude (API Direta)
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("CLAUDE_API_KEY"), "anthropic-version": "2023-06-01" },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307", // Usando um modelo mais rápido para fallback
                max_tokens: 500,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });
        if (!response.ok) throw new Error(`Claude fallback failed: ${await response.text()}`);
        const data = await response.json();
        return data.content[0].text.trim();
    }
}

async function generateAndUploadImage(prompt, supabase) {
    const initResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${Deno.env.get("REPLICATE_API_KEY")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: {
                prompt: prompt,
                negative_prompt: "text, words, letters, numbers, signature, watermark, typography, font, writing, script",
                aspect_ratio: "9:16",
                num_inference_steps: 4,
                output_format: "png",
            },
        }),
    });

    if (!initResponse.ok) {
        const errorBody = await initResponse.json();
        if (initResponse.status === 429) {
            const retryAfter = errorBody.retry_after || 5;
            console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return generateAndUploadImage(prompt, supabase);
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

    const { visual_style_guide, pages: storyScript } = await generateStoryScriptAndStyle(post.content, automation.number_of_pages);
    await updateLog(supabase, logId, 'processing', 'Roteiro e guia de estilo gerados.', { visual_style_guide });

    const finalPages = [];
    for (const [index, pageContent] of storyScript.entries()) {
      await updateLog(supabase, logId, 'processing', `Gerando imagem para a página ${index + 1}...`);
      
      if (index > 0) await new Promise(resolve => setTimeout(resolve, 1000));
      
      const imagePrompt = await generateImagePrompt(visual_style_guide, pageContent.text);
      const imageUrl = await generateAndUploadImage(imagePrompt, supabase);
      
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
      
      if (automation.add_post_link_on_last_page && index === storyScript.length - 1) {
        page.outlink = { href: `https://www.paxword.com/pt/blog/${post.slug}`, ctaText: 'Leia o Artigo' };
      }
      finalPages.push(page);
    }
    await updateLog(supabase, logId, 'processing', 'Todas as imagens foram geradas.');

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