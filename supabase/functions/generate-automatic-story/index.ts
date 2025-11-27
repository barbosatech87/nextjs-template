// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Replicate from 'https://esm.sh/replicate@1.0.1';

declare const Deno: any;
declare const Request: any;
declare const Response: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

// --- FUNÇÕES DE LOG ---
async function logEvent(supabase, automationId, status, message, details = {}, storyId = null) {
  console.log(`[LOG - ${status}] ${message}`);
  
  try {
    const safeDetails = JSON.parse(JSON.stringify(details, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    const { error } = await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: storyId,
      status,
      message,
      details: safeDetails,
    });

    if (error) {
      console.error(`[DB LOG ERROR] Failed to write log to database:`, error.message);
    }
  } catch (logError) {
    console.error(`[DB LOG CATCH] Exception during logging:`, logError);
  }
}

// --- GERAÇÃO DE TEXTO (openai/gpt-4o-mini no Replicate) ---
async function generateStoryScript(replicate, postContent, pageCount) {
  console.log("[STEP] Generating script with gpt-4o-mini...");

  const systemPrompt = `Você é uma IA editora especializada em Web Stories.
  Sua tarefa é resumir o artigo fornecido em um roteiro de EXATAMENTE ${pageCount} páginas.
  
  Sua saída DEVE ser APENAS um JSON válido (sem markdown, sem blocos de código) com esta estrutura exata:
  {
    "title": "Título curto (máx 40 chars)",
    "slug": "titulo-slugificado",
    "pages": [
      { 
        "page_number": 1, 
        "text_content": "Texto curto e impactante (máx 150 chars).",
        "image_prompt": "Descrição visual da cena para gerar a imagem de fundo em estilo aquarela minimalista. Em INGLÊS. Sem texto." 
      }
    ]
  }`;

  const userPrompt = `Conteúdo:\n\n${postContent.substring(0, 6000)}`;

  const input = {
    prompt: userPrompt,
    system_prompt: systemPrompt,
    max_tokens: 2048,
    temperature: 0.5,
    openai_api_key: Deno.env.get("OPENAI_API_KEY")
  };

  const output = await replicate.run("openai/gpt-4o-mini", { input });
  const fullText = Array.isArray(output) ? output.join("") : String(output);
  const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parse Error. Raw output from Replicate:", fullText);
    throw new Error(`A IA gerou um JSON inválido. Erro: ${e.message}`);
  }
}

// --- GERAÇÃO DE IMAGEM (black-forest-labs/flux-schnell no Replicate) ---
async function generateImageWithReplicate(replicate, prompt, userId, supabase) {
  console.log(`[STEP] Generating image with prompt: "${prompt.substring(0, 50)}..."`);
  const finalPrompt = `Vertical image (9:16), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT. ${prompt}`;

  const input = {
    prompt: finalPrompt,
    aspect_ratio: "9:16",
    output_format: "png",
    go_fast: true,
    disable_safety_checker: true
  };

  const output = await replicate.run("black-forest-labs/flux-schnell", { input });
  const imageUrl = Array.isArray(output) ? output[0] : String(output);
  
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error(`Replicate returned invalid output for image: ${JSON.stringify(output)}`);
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Falha ao baixar imagem do Replicate.");
  
  const arrayBuffer = await imageRes.arrayBuffer();
  const fileName = `stories/${userId}/${crypto.randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage.from("blog_images").upload(fileName, arrayBuffer, {
    contentType: 'image/png',
    upsert: false,
    cacheControl: '31536000, immutable'
  });

  if (uploadError) throw new Error(`Erro upload storage: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// --- MAIN ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  let automationId = null;

  try {
    console.log("[START] Function invoked.");

    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
    if (!internalSecret || internalSecret !== expectedSecret) {
      throw new Error("Unauthorized: Missing or incorrect internal secret.");
    }
    console.log("[AUTH] Internal secret validated.");

    const replicateApiKey = Deno.env.get("REPLICATE_API_KEY");
    if (!replicateApiKey) {
      throw new Error("REPLICATE_API_KEY not configured.");
    }
    const replicate = new Replicate({ auth: replicateApiKey });
    console.log("[INIT] Replicate SDK initialized.");

    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("Automation ID is missing from request body.");
    console.log(`[PARAM] Automation ID: ${automationId}`);

    await logEvent(supabase, automationId, 'processing', 'Iniciando automação...');

    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automação não encontrada: ${autoError?.message || 'Not found'}`);
    console.log(`[DATA] Automation found: "${automation.name}"`);
    
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'Automação inativa.');
      return new Response(JSON.stringify({ message: "Automation is inactive" }), { headers: corsHeaders });
    }

    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    if (postError || !post) {
      const msg = 'Nenhum post novo disponível para processar.';
      await logEvent(supabase, automationId, 'success', msg);
      return new Response(JSON.stringify({ message: msg }), { headers: corsHeaders });
    }
    console.log(`[DATA] Post found: "${post.title}"`);

    await logEvent(supabase, automationId, 'processing', `Post selecionado: "${post.title}". Gerando roteiro...`);

    const script = await generateStoryScript(replicate, post.content, automation.number_of_pages);
    await logEvent(supabase, automationId, 'processing', `Roteiro gerado: "${script.title}". Gerando ${script.pages.length} imagens...`);

    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const pageData = script.pages[i];
      const imageUrl = await generateImageWithReplicate(replicate, pageData.image_prompt, post.author_id, supabase);
      storyPages.push({
        id: crypto.randomUUID(),
        backgroundSrc: imageUrl,
        backgroundType: 'image',
        elements: [{
          id: crypto.randomUUID(),
          type: 'text',
          content: `<p style="font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">${pageData.text_content}</p>`,
          style: {
            top: '75%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '16px', borderRadius: '12px', textAlign: 'center', width: '85%',
          }
        }]
      });
    }
    console.log("[STEP] All images generated and uploaded.");

    if (automation.add_post_link_on_last_page) {
      storyPages[storyPages.length - 1].outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo'
      };
    }

    const status = automation.publish_automatically ? 'published' : 'draft';
    const { data: newStory, error: saveError } = await supabase.from('web_stories').insert({
      author_id: post.author_id,
      title: script.title,
      slug: script.slug || post.slug + '-story',
      story_data: { pages: storyPages },
      poster_image_src: storyPages[0].backgroundSrc,
      status: status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      language_code: 'pt'
    }).select('id').single();

    if (saveError) throw new Error(`Erro ao salvar story: ${saveError.message}`);
    console.log(`[STEP] Story saved with ID: ${newStory.id}`);

    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    await logEvent(supabase, automationId, 'success', 'Story criada com sucesso!', { storyId: newStory.id }, newStory.id);
    
    return new Response(JSON.stringify({ success: true, storyId: newStory.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[FATAL ERROR]", error);
    if (automationId) {
      await logEvent(supabase, automationId, 'error', `Falha: ${error.message}`, { stack: error.stack });
    }
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});