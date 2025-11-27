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
  
  // Tenta gravar no banco
  const { error } = await supabase.from('story_automation_logs').insert({
    automation_id: automationId,
    story_id: storyId,
    status,
    message,
    details: details ? JSON.parse(JSON.stringify(details)) : {},
  });

  if (error) {
    console.error(`[DB LOG ERROR] Failed to write log: ${error.message}`);
    return error.message; // Retorna erro para debug
  }
  return null;
}

// --- UTILITÁRIOS REPLICATE ---
// ... (Mantendo a função runReplicateModel simplificada que criamos antes se necessário, 
// mas aqui vamos usar a SDK diretamente que é mais limpa, com try/catch melhorado)

// --- MAIN ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  // Inicializa SDK
  const replicateApiKey = Deno.env.get("REPLICATE_API_KEY");
  if (!replicateApiKey) {
    return new Response(JSON.stringify({ error: 'Configuration Error: REPLICATE_API_KEY missing' }), { status: 500, headers: corsHeaders });
  }
  const replicate = new Replicate({ auth: replicateApiKey });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  let automationId = null;
  const debugInfo = { logs: [], errors: [] }; // Coleta info para resposta HTTP

  try {
    const body = await req.json();
    automationId = body.automationId;

    if (!automationId) throw new Error("Automation ID is missing in request body");

    debugInfo.step = "Fetching automation";
    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    
    if (autoError) throw new Error(`Automation not found: ${autoError.message}`);
    if (!automation) throw new Error("Automation not found (null data)");
    
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'Automação inativa.');
      return new Response(JSON.stringify({ message: "Automation is inactive", debug: debugInfo }), { headers: corsHeaders });
    }

    debugInfo.step = "Fetching unused post";
    // Chamada RPC
    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    
    if (postError) {
      // PGRST116 significa "nenhuma linha retornada" no .single(), o que é esperado se não houver posts
      if (postError.code === 'PGRST116') {
        const msg = 'Nenhum post novo disponível para processar (RPC returned no rows).';
        await logEvent(supabase, automationId, 'processing', msg);
        return new Response(JSON.stringify({ message: msg, debug: debugInfo }), { headers: corsHeaders });
      }
      throw new Error(`RPC Error getting post: ${postError.message}`);
    }

    if (!post) {
      const msg = 'Nenhum post retornado (null data).';
      await logEvent(supabase, automationId, 'processing', msg);
      return new Response(JSON.stringify({ message: msg, debug: debugInfo }), { headers: corsHeaders });
    }

    debugInfo.postTitle = post.title;
    const logErr = await logEvent(supabase, automationId, 'processing', `Post selecionado: "${post.title}". Iniciando geração...`);
    if (logErr) debugInfo.errors.push(`Log failed: ${logErr}`);

    // --- GERAÇÃO DE ROTEIRO ---
    debugInfo.step = "Generating Script with OpenAI/Replicate";
    const systemPrompt = `Você é uma IA editora especializada em Web Stories.
    Resuma o artigo em um roteiro de EXATAMENTE ${automation.number_of_pages || 5} páginas.
    Saída APENAS JSON válido com estrutura:
    { "title": "...", "slug": "...", "pages": [ { "page_number": 1, "text_content": "...", "image_prompt": "..." } ] }`;

    const inputScript = {
      prompt: `Conteúdo:\n\n${post.content.substring(0, 6000)}`,
      system_prompt: systemPrompt,
      max_tokens: 2048,
      temperature: 0.5
    };

    const outputScript = await replicate.run("openai/gpt-4o-mini", { input: inputScript });
    const fullTextScript = Array.isArray(outputScript) ? outputScript.join("") : String(outputScript);
    const scriptJson = JSON.parse(fullTextScript.replace(/```json/g, "").replace(/```/g, "").trim());

    debugInfo.scriptTitle = scriptJson.title;
    
    // --- GERAÇÃO DE IMAGENS ---
    debugInfo.step = "Generating Images";
    const storyPages = [];
    
    for (let i = 0; i < scriptJson.pages.length; i++) {
      const pageData = scriptJson.pages[i];
      
      const inputImage = {
        prompt: `Vertical image (9:16), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT. ${pageData.image_prompt}`,
        aspect_ratio: "9:16",
        output_format: "png",
        go_fast: true,
        disable_safety_checker: true
      };

      const outputImage = await replicate.run("black-forest-labs/flux-schnell", { input: inputImage });
      const imageUrl = Array.isArray(outputImage) ? outputImage[0] : String(outputImage);

      // Upload Storage
      const imageRes = await fetch(imageUrl);
      const arrayBuffer = await imageRes.arrayBuffer();
      const fileName = `stories/${post.author_id}/${crypto.randomUUID()}.png`;
      
      const { error: uploadError } = await supabase.storage.from("blog_images").upload(fileName, arrayBuffer, {
        contentType: 'image/png',
        upsert: false
      });
      if (uploadError) throw new Error(`Storage upload error: ${uploadError.message}`);
      
      const { data: publicUrlData } = supabase.storage.from("blog_images").getPublicUrl(fileName);
      
      storyPages.push({
        id: crypto.randomUUID(),
        backgroundSrc: publicUrlData.publicUrl,
        backgroundType: 'image',
        elements: [{
          id: crypto.randomUUID(),
          type: 'text',
          content: `<p style="font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">${pageData.text_content}</p>`,
          style: { top: '75%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', textAlign: 'center', width: '85%' }
        }]
      });
    }

    // Link Final
    if (automation.add_post_link_on_last_page) {
      storyPages[storyPages.length - 1].outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo'
      };
    }

    // Salvar Story
    debugInfo.step = "Saving Story";
    const status = automation.publish_automatically ? 'published' : 'draft';
    const { data: newStory, error: saveError } = await supabase.from('web_stories').insert({
      author_id: post.author_id,
      title: scriptJson.title,
      slug: scriptJson.slug || post.slug + '-story',
      story_data: { pages: storyPages },
      poster_image_src: storyPages[0].backgroundSrc,
      status: status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      language_code: 'pt'
    }).select('id').single();

    if (saveError) throw new Error(`Save Story Error: ${saveError.message}`);

    // Marcar post como usado
    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    await logEvent(supabase, automationId, 'success', 'Story criada com sucesso!', { storyId: newStory.id }, newStory.id);
    
    return new Response(JSON.stringify({ success: true, storyId: newStory.id, debug: debugInfo }), { headers: corsHeaders });

  } catch (error) {
    console.error("FATAL ERROR:", error);
    debugInfo.error = error.message;
    debugInfo.stack = error.stack;
    
    if (automationId) {
      await logEvent(supabase, automationId, 'error', `Falha Fatal: ${error.message}`);
    }
    
    // Retorna 200 com erro no corpo para garantir que o cliente veja a resposta JSON, 
    // já que 500 às vezes é mascarado pelo gateway.
    return new Response(JSON.stringify({ success: false, error: error.message, debug: debugInfo }), { 
      status: 200, // Usando 200 para garantir que o corpo JSON seja entregue ao cliente para debug
      headers: corsHeaders 
    });
  }
});