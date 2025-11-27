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
  console.log(`[LOG - ${status}] ${message}`);
  try {
    await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: storyId,
      status,
      message,
      details,
    });
  } catch (logError) {
    console.error(`[FATAL] Exception during DB logging:`, logError.message);
  }
}

// --- UTILITÁRIO REPLICATE ---
async function runReplicatePrediction(version, input) {
  const replicateKey = Deno.env.get("REPLICATE_API_KEY");
  if (!replicateKey) throw new Error("REPLICATE_API_KEY não configurada.");

  // 1. Inicia a Predição
  const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait" // Tenta esperar o resultado imediato (até 60s)
    },
    body: JSON.stringify({
      version: version, // Hash da versão do modelo
      input: input
    })
  });

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    throw new Error(`Erro Replicate (Start): ${startResponse.status} - ${errText}`);
  }

  let prediction = await startResponse.json();

  // 2. Polling (se não retornou pronto com Prefer: wait)
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
    await new Promise(r => setTimeout(r, 2000)); // Espera 2s
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { "Authorization": `Bearer ${replicateKey}` }
    });
    if (!pollResponse.ok) throw new Error("Erro Replicate (Poll)");
    prediction = await pollResponse.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate falhou: ${prediction.error || prediction.status}`);
  }

  return prediction.output;
}

// --- GERAÇÃO DE TEXTO (REPLICATE - Llama 3 70B) ---
// Usamos Llama 3 70B pois gpt-4o-mini não existe no Replicate.
async function generateStoryScript(postContent, pageCount) {
  const systemPrompt = `Você é uma IA editora especializada em Web Stories.
  Sua tarefa é resumir o artigo fornecido em um roteiro de EXATAMENTE ${pageCount} páginas.
  
  Sua saída DEVE ser APENAS um JSON válido (sem markdown, sem explicações antes ou depois) com esta estrutura:
  {
    "title": "Título curto (máx 40 chars)",
    "slug": "titulo-slugificado",
    "pages": [
      { 
        "page_number": 1, 
        "text_content": "Texto curto e impactante para a página (máx 150 chars).",
        "image_prompt": "Descrição visual da cena para gerar a imagem de fundo em estilo aquarela minimalista. Em INGLÊS. Sem texto na imagem." 
      }
    ]
  }`;

  const userPrompt = `Gere o roteiro JSON para o seguinte conteúdo:\n\n${postContent.substring(0, 6000)}`;

  // Meta Llama 3 70B Instruct (Hash da versão mais recente no Replicate)
  const modelVersion = "fbfb20b472b7f3bd1191eb997934474f838295138b84c9c3857e61303833075b"; 
  
  const output = await runReplicatePrediction(modelVersion, {
    prompt: userPrompt,
    system_prompt: systemPrompt,
    max_tokens: 2000,
    temperature: 0.5,
    top_p: 0.9,
  });

  // O Replicate retorna o texto como um array de strings (tokens/chunks)
  const fullText = output.join("").trim();
  
  // Tenta limpar blocos de markdown se houver
  const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Erro ao fazer parse do JSON do Llama:", cleanJson);
    throw new Error("A IA gerou um JSON inválido.");
  }
}

// --- GERAÇÃO DE IMAGEM (REPLICATE - Flux Schnell) ---
async function generateImageWithReplicate(prompt, userId, supabase) {
  // Hash do black-forest-labs/flux-schnell
  const modelVersion = "f4beb6696700cb744360434246473347b7d6c6e767426630c634032607963236";
  
  const finalPrompt = `Vertical image (9:16), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT. ${prompt}`;

  const output = await runReplicatePrediction(modelVersion, {
    prompt: finalPrompt,
    aspect_ratio: "9:16",
    output_format: "png",
    go_fast: true, // Configuração específica do Schnell
    disable_safety_checker: true 
  });

  const imageUrl = output[0]; // Flux retorna lista de URLs
  if (!imageUrl) throw new Error("Replicate não retornou URL de imagem.");

  // Upload para Supabase Storage
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

// --- FUNÇÃO PRINCIPAL ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  let automationId = null;

  try {
    const body = await req.json();
    automationId = body.automationId;

    if (!automationId) throw new Error("Automation ID is missing");

    await logEvent(supabase, automationId, 'processing', 'Iniciando automação via Replicate...');

    // 1. Busca Automação e Post
    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error("Automação não encontrada.");
    
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'A automação está desativada.');
      return new Response(JSON.stringify({ message: "Automation inactive" }), { headers: corsHeaders });
    }

    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    if (postError || !post) {
      await logEvent(supabase, automationId, 'processing', 'Nenhum post novo disponível.');
      return new Response(JSON.stringify({ message: "No posts found" }), { headers: corsHeaders });
    }

    await logEvent(supabase, automationId, 'processing', `Post selecionado: "${post.title}". Gerando roteiro com Llama 3 (Replicate)...`);

    // 2. Gera Roteiro (Texto)
    const script = await generateStoryScript(post.content, automation.number_of_pages);
    await logEvent(supabase, automationId, 'processing', `Roteiro gerado. Criando ${script.pages.length} imagens com Flux Schnell (Replicate)...`);

    // 3. Gera Imagens (Imagem)
    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const pageData = script.pages[i];
      await logEvent(supabase, automationId, 'processing', `Gerando imagem ${i + 1}/${script.pages.length}...`);
      
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

    // Link Final
    if (automation.add_post_link_on_last_page) {
      const lastPage = storyPages[storyPages.length - 1];
      lastPage.outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo'
      };
    }

    // 4. Salva Story
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

    // Marca post como usado
    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    // Tradução (opcional, pode ser disparada de forma assíncrona)
    if (status === 'published') {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-web-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': Deno.env.get('INTERNAL_SECRET_KEY') },
        body: JSON.stringify({ storyId: newStory.id, title: script.title, storyData: { pages: storyPages } }),
      }).catch(console.error);
    }

    await logEvent(supabase, automationId, 'success', 'Story criada com sucesso!', { storyId: newStory.id }, newStory.id);
    return new Response(JSON.stringify({ success: true, storyId: newStory.id }), { headers: corsHeaders });

  } catch (error) {
    console.error("Error:", error);
    if (automationId) {
      await logEvent(supabase, automationId, 'error', `Falha: ${error.message}`);
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});