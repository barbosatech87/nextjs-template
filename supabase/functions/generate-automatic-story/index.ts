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
    const { error } = await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: storyId,
      status,
      message,
      details,
    });
    if (error) console.error(`[FATAL] Failed to log event to DB:`, error.message);
  } catch (logError) {
    console.error(`[FATAL] Exception during DB logging:`, logError.message);
  }
}

// --- GERAÇÃO DE TEXTO (Mantendo OpenAI/Claude para o Roteiro) ---
async function generateStoryScript(postContent, pageCount) {
  const systemPrompt = `Você é uma IA editora especializada em Web Stories.
  Sua tarefa é resumir o artigo fornecido em um roteiro de EXATAMENTE ${pageCount} páginas.
  
  Sua saída DEVE ser um JSON válido com esta estrutura:
  {
    "title": "Título curto (máx 40 chars)",
    "slug": "titulo-slugificado",
    "pages": [
      { 
        "page_number": 1, 
        "text_content": "Texto curto e impactante (máx 150 chars).",
        "image_prompt": "Descrição visual da cena em INGLÊS. Sem texto na imagem." 
      }
    ]
  }`;

  const userPrompt = `Gere o roteiro JSON para:\n\n${postContent.substring(0, 8000)}`;

  // Tenta Claude Primeiro
  if (Deno.env.get("CLAUDE_API_KEY")) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("CLAUDE_API_KEY"), "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.5,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch (e) { console.error("Claude error:", e); }
  }

  // Fallback OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error(`Erro OpenAI texto: ${await response.text()}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- GERAÇÃO DE IMAGEM COM REPLICATE ---
async function generateImageWithReplicate(prompt, userId, supabase) {
  const replicateKey = Deno.env.get("REPLICATE_API_KEY");
  if (!replicateKey) throw new Error("REPLICATE_API_KEY não configurada.");

  // Usando Flux-Schnell (rápido e boa qualidade)
  const model = "black-forest-labs/flux-schnell"; 
  const finalPrompt = `Vertical image (9:16), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT. ${prompt}`;

  // 1. Inicia a Predição
  const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait" // Tenta esperar o resultado imediato
    },
    body: JSON.stringify({
      version: "f4beb6696700cb744360434246473347b7d6c6e767426630c634032607963236", // Hash do Flux Schnell (opcional se usar url do model, mas bom garantir)
      input: {
        prompt: finalPrompt,
        aspect_ratio: "9:16",
        output_format: "png",
        go_fast: true
      }
    })
  });

  if (!startResponse.ok) {
    const errText = await startResponse.text();
    throw new Error(`Erro Replicate (Start): ${startResponse.status} - ${errText}`);
  }

  let prediction = await startResponse.json();

  // 2. Polling (se não retornou pronto com Prefer: wait)
  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    await new Promise(r => setTimeout(r, 2000)); // Espera 2s
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { "Authorization": `Bearer ${replicateKey}` }
    });
    if (!pollResponse.ok) throw new Error("Erro Replicate (Poll)");
    prediction = await pollResponse.json();
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate falhou: ${prediction.error}`);
  }

  const imageUrl = prediction.output[0];
  if (!imageUrl) throw new Error("Replicate não retornou URL de imagem.");

  // 3. Upload para Supabase Storage
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

    await logEvent(supabase, automationId, 'processing', 'Iniciando automação com Replicate...');

    // 1. Busca Automação e Post
    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error("Automação não encontrada.");
    
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'Automação inativa.');
      return new Response(JSON.stringify({ message: "Inactive" }), { headers: corsHeaders });
    }

    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    if (postError || !post) {
      await logEvent(supabase, automationId, 'processing', 'Nenhum post novo encontrado.');
      return new Response(JSON.stringify({ message: "No posts" }), { headers: corsHeaders });
    }

    await logEvent(supabase, automationId, 'processing', `Post: "${post.title}". Gerando roteiro...`);

    // 2. Gera Roteiro
    const script = await generateStoryScript(post.content, automation.number_of_pages);
    await logEvent(supabase, automationId, 'processing', `Roteiro criado. Gerando ${script.pages.length} imagens via Replicate...`);

    // 3. Gera Imagens (Replicate)
    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const pageData = script.pages[i];
      await logEvent(supabase, automationId, 'processing', `Replicate: Gerando imagem ${i + 1}/${script.pages.length}...`);
      
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
      storyPages[storyPages.length - 1].outlink = {
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

    if (saveError) throw new Error(`Erro ao salvar: ${saveError.message}`);

    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

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