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

// --- LOG HELPER ---
async function logEvent(supabase, automationId, status, message, details = {}, storyId = null) {
  console.log(`[${status.toUpperCase()}] ${message}`);
  try {
    await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: storyId,
      status,
      message,
      details: details || {},
    });
  } catch (e) {
    console.error("Failed to log:", e.message);
  }
}

// --- REPLICATE API HELPERS ---
async function callReplicateModel(modelVersion, input, apiToken) {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: modelVersion,
      input: input,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  const prediction = await response.json();
  const predictionId = prediction.id;

  // Poll até completar
  let result = prediction;
  while (result.status === "starting" || result.status === "processing") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { "Authorization": `Bearer ${apiToken}` },
    });
    result = await pollResponse.json();
  }

  if (result.status === "failed") {
    throw new Error(`Replicate prediction failed: ${result.error}`);
  }

  return result.output;
}

// --- MAIN ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let automationId = null;

  try {
    console.log("=== FUNCTION START ===");

    // Auth
    const internalSecret = req.headers.get('X-Internal-Secret');
    if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
      throw new Error("Unauthorized");
    }

    const replicateToken = Deno.env.get("REPLICATE_API_KEY");
    if (!replicateToken) {
      throw new Error("REPLICATE_API_KEY not set");
    }

    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("Missing automationId");

    console.log(`Processing automation: ${automationId}`);
    await logEvent(supabase, automationId, 'processing', 'Iniciando...');

    // Fetch automation
    const { data: automation, error: autoErr } = await supabase
      .from('story_automations')
      .select('*')
      .eq('id', automationId)
      .single();

    if (autoErr || !automation) throw new Error("Automation not found");
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'Inativa');
      return new Response(JSON.stringify({ message: "Inactive" }), { headers: corsHeaders });
    }

    // Fetch post
    const { data: post, error: postErr } = await supabase
      .rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id })
      .single();

    if (postErr || !post) {
      await logEvent(supabase, automationId, 'processing', 'Sem posts novos');
      return new Response(JSON.stringify({ message: "No posts" }), { headers: corsHeaders });
    }

    console.log(`Post found: ${post.title}`);
    await logEvent(supabase, automationId, 'processing', `Post: ${post.title}`);

    // Generate script with GPT-4o-mini
    const scriptInput = {
      prompt: `Resuma em ${automation.number_of_pages} páginas:\n\n${post.content.substring(0, 5000)}`,
      system_prompt: `Retorne APENAS JSON: {"title":"...","slug":"...","pages":[{"page_number":1,"text_content":"...","image_prompt":"..."}]}`,
      max_tokens: 2048,
      temperature: 0.5,
      openai_api_key: Deno.env.get("OPENAI_API_KEY")
    };

    const scriptOutput = await callReplicateModel(
      "openai/gpt-4o-mini",
      scriptInput,
      replicateToken
    );

    const scriptText = Array.isArray(scriptOutput) ? scriptOutput.join("") : String(scriptOutput);
    const script = JSON.parse(scriptText.replace(/```json/g, "").replace(/```/g, "").trim());

    console.log(`Script generated: ${script.title}`);
    await logEvent(supabase, automationId, 'processing', `Roteiro: ${script.title}`);

    // Generate images
    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const page = script.pages[i];
      
      const imageInput = {
        prompt: `Vertical 9:16, watercolor, soft colors, christian theme, NO TEXT. ${page.image_prompt}`,
        aspect_ratio: "9:16",
        output_format: "png",
        go_fast: true,
        disable_safety_checker: true
      };

      const imageOutput = await callReplicateModel(
        "black-forest-labs/flux-schnell",
        imageInput,
        replicateToken
      );

      const imageUrl = Array.isArray(imageOutput) ? imageOutput[0] : String(imageOutput);
      
      // Upload to storage
      const imgRes = await fetch(imageUrl);
      const imgBuffer = await imgRes.arrayBuffer();
      const fileName = `stories/${post.author_id}/${crypto.randomUUID()}.png`;
      
      await supabase.storage.from("blog_images").upload(fileName, imgBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000, immutable'
      });

      const { data: urlData } = supabase.storage.from("blog_images").getPublicUrl(fileName);

      storyPages.push({
        id: crypto.randomUUID(),
        backgroundSrc: urlData.publicUrl,
        backgroundType: 'image',
        elements: [{
          id: crypto.randomUUID(),
          type: 'text',
          content: `<p style="font-weight:700;text-shadow:2px 2px 4px rgba(0,0,0,0.8);">${page.text_content}</p>`,
          style: {
            top: '75%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: '24px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '16px', borderRadius: '12px', textAlign: 'center', width: '85%'
          }
        }]
      });
    }

    // Add link
    if (automation.add_post_link_on_last_page) {
      storyPages[storyPages.length - 1].outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo'
      };
    }

    // Save story
    const storyStatus = automation.publish_automatically ? 'published' : 'draft';
    const { data: newStory, error: saveErr } = await supabase.from('web_stories').insert({
      author_id: post.author_id,
      title: script.title,
      slug: script.slug || `${post.slug}-story`,
      story_data: { pages: storyPages },
      poster_image_src: storyPages[0].backgroundSrc,
      status: storyStatus,
      published_at: storyStatus === 'published' ? new Date().toISOString() : null,
      language_code: 'pt'
    }).select('id').single();

    if (saveErr) throw new Error(`Save error: ${saveErr.message}`);

    // Mark post as used
    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    await logEvent(supabase, automationId, 'success', 'Story criada!', { storyId: newStory.id }, newStory.id);
    
    return new Response(
      JSON.stringify({ success: true, storyId: newStory.id }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("FATAL:", error);
    if (automationId) {
      await logEvent(supabase, automationId, 'error', error.message);
    }
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});