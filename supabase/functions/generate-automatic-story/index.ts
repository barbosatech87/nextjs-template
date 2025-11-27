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

// --- FUNÇÕES DE LOG ---
async function logEvent(supabase, automationId, status, message, details = {}, storyId = null) {
  console.log(`[LOG - ${status}] ${message}`); // Log no console da Edge Function
  
  // Tenta gravar no banco. Se falhar, não crasha a função, mas loga o erro no console.
  const { error } = await supabase.from('story_automation_logs').insert({
    automation_id: automationId,
    story_id: storyId,
    status,
    message,
    details,
  });

  if (error) {
    console.error(`[DB LOG ERROR] Failed to write log to database:`, error.message);
  }
}

// --- UTILITÁRIO REPLICATE ---
async function runReplicateModel(model, input) {
  const replicateKey = Deno.env.get("REPLICATE_API_KEY");
  if (!replicateKey) throw new Error("REPLICATE_API_KEY não configurada.");

  console.log(`[Replicate] Chamando modelo: ${model}`);

  // Endpoint para rodar a última versão do modelo
  const apiUrl = `https://api.replicate.com/v1/models/${model}/predictions`;

  const startResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait" // Tenta esperar o resultado
    },
    body: JSON.stringify({ input })
  });

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    // Tenta fazer parse do erro JSON para ser mais legível
    try {
      const errJson = JSON.parse(errText);
      throw new Error(`Erro Replicate (${model}): ${errJson.detail || errJson.error || errText}`);
    } catch (e) {
      throw new Error(`Erro Replicate (${model}): ${startResponse.status} - ${errText}`);
    }
  }

  let prediction = await startResponse.json();

  // Polling se necessário
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { "Authorization": `Bearer ${replicateKey}` }
    });
    if (!pollResponse.ok) throw new Error("Erro Replicate (Poll)");
    prediction = await pollResponse.json();
  }

  if (prediction.status !== "succeeded") {
    console.error("Replicate prediction failed:", prediction);
    throw new Error(`Replicate falhou (${model}): ${prediction.error || "Erro desconhecido"}`);
  }

  return prediction.output;
}

// --- GERAÇÃO DE TEXTO (openai/gpt-4o-mini no Replicate) ---
async function generateStoryScript(postContent, pageCount) {
  const systemPrompt = `Você é uma IA editora especializada em Web Stories.
  Sua tarefa é resumir o artigo fornecido em um roteiro de EXATAMENTE ${pageCount} páginas.
  
  Sua saída DEVE ser APENAS um JSON válido (sem markdown) com esta estrutura:
  {
    "title": "Título curto (máx 40 chars)",
    "slug": "titulo-slugificado",
    "pages": [
      { 
        "page_number": 1, 
        "text_content": "Texto curto (máx 150 chars).",
        "image_prompt": "Descrição visual da cena em estilo aquarela minimalista. Em INGLÊS. Sem texto." 
      }
    ]
  }`;

  const userPrompt = `Conteúdo:\n\n${postContent.substring(0, 6000)}`;

  // Modelo: openai/gpt-4o-mini
  // Nota: Modelos OpenAI no Replicate geralmente exigem a chave da OpenAI no input
  const output = await runReplicateModel("openai/gpt-4o-mini", {
    prompt: userPrompt,
    system_prompt: systemPrompt,
    max_tokens: 2048,
    temperature: 0.5,
    openai_api_key: Deno.env.get("OPENAI_API_KEY") // Passando a chave caso o wrapper exija
  });

  // Output geralmente é uma stream de strings ou string única
  const fullText = Array.isArray(output) ? output.join("") : output;
  const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parse Error. Raw output:", fullText);
    throw new Error("A IA gerou um JSON inválido.");
  }
}

// --- GERAÇÃO DE IMAGEM (black-forest-labs/flux-schnell no Replicate) ---
async function generateImageWithReplicate(prompt, userId, supabase) {
  const finalPrompt = `Vertical image (9:16), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT. ${prompt}`;

  // Modelo: black-forest-labs/flux-schnell
  const output = await runReplicateModel("black-forest-labs/flux-schnell", {
    prompt: finalPrompt,
    aspect_ratio: "9:16",
    output_format: "png",
    go_fast: true,
    disable_safety_checker: true 
  });

  // Flux retorna lista de URLs
  const imageUrl = Array.isArray(output) ? output[0] : output;
  if (!imageUrl) throw new Error("Replicate não retornou URL de imagem.");

  // Upload para Supabase
  const imageRes = await fetch(imageUrl);
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

  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  let automationId = null;

  try {
    const body = await req.json();
    automationId = body.automationId;

    if (!automationId) throw new Error("Automation ID is missing");

    await logEvent(supabase, automationId, 'processing', 'Iniciando (Replicate: gpt-4o-mini + flux-schnell)...');

    const { data: automation } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (!automation) throw new Error("Automação não encontrada.");
    
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'Automação inativa.');
      return new Response(JSON.stringify({ message: "Inactive" }), { headers: corsHeaders });
    }

    const { data: post } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    if (!post) {
      await logEvent(supabase, automationId, 'success', 'Nenhum post novo para processar.');
      return new Response(JSON.stringify({ message: "No posts" }), { headers: corsHeaders });
    }

    await logEvent(supabase, automationId, 'processing', `Post: "${post.title}". Gerando roteiro...`);

    const script = await generateStoryScript(post.content, automation.number_of_pages);
    
    await logEvent(supabase, automationId, 'processing', `Roteiro OK. Gerando ${script.pages.length} imagens...`);

    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const pageData = script.pages[i];
      // Log de progresso a cada imagem pode ser excessivo e causar lentidão, descomente se necessário
      // await logEvent(supabase, automationId, 'processing', `Gerando imagem ${i+1}/${script.pages.length}...`);
      
      const imageUrl = await generateImageWithReplicate(pageData.image_prompt, post.author_id, supabase);
      
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

    if (saveError) throw saveError;

    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    await logEvent(supabase, automationId, 'success', 'Story criada com sucesso!', { storyId: newStory.id }, newStory.id);
    
    return new Response(JSON.stringify({ success: true, storyId: newStory.id }), { headers: corsHeaders });

  } catch (error) {
    console.error("FATAL ERROR:", error);
    if (automationId) {
      await logEvent(supabase, automationId, 'error', `Erro: ${error.message}`);
    }
    // Retorna 500 para o cliente saber que falhou
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});