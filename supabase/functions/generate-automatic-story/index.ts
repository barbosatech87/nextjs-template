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
  console.log(`[LOG - ${status}] ${message}`); // Log no console do Supabase também
  try {
    // Se já existe um log de processamento para essa automação que não foi finalizado, podemos atualizá-lo ou criar um novo.
    // Para simplificar e garantir histórico, vamos sempre inserir.
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

// --- GERAÇÃO DE TEXTO (Claude com fallback para OpenAI) ---
async function generateStoryScript(postContent, pageCount) {
  const systemPrompt = `Você é uma IA editora especializada em Web Stories (formato visual tipo Instagram/Snapchat).
  Sua tarefa é resumir o artigo fornecido em um roteiro de EXATAMENTE ${pageCount} páginas.
  
  Sua saída DEVE ser um JSON válido com esta estrutura:
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
  }
  
  O array "pages" deve ter exatamente ${pageCount} itens.
  O "image_prompt" deve ser artístico, conceitual e não conter pedidos de texto escrito.`;

  const userPrompt = `Gere o roteiro JSON para o seguinte conteúdo:\n\n${postContent.substring(0, 8000)}`; // Limita tamanho para não estourar tokens

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
      console.warn("Claude falhou, tentando OpenAI...");
    } catch (e) {
      console.error("Erro no Claude:", e);
    }
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

  if (!response.ok) throw new Error(`Erro na geração de texto (OpenAI): ${await response.text()}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- GERAÇÃO DE IMAGEM (DALL-E 3) ---
async function generateImage(prompt, userId, supabase) {
  // Enriquecer o prompt para garantir o estilo
  const finalPrompt = `Vertical image (9:16 aspect ratio), minimalist watercolor style, soft pastel colors, christian spiritual theme. NO TEXT, NO LETTERS. ${prompt}`;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1792", // Formato vertical
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Erro DALL-E:", err);
    throw new Error(`Erro ao gerar imagem: ${err}`);
  }

  const data = await response.json();
  const tempUrl = data.data?.[0]?.url;

  // Upload para Supabase Storage
  const imageRes = await fetch(tempUrl);
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

  // Validação de Segredo
  const internalSecret = req.headers.get('X-Internal-Secret');
  const expectedSecret = Deno.env.get('INTERNAL_SECRET_KEY');
  if (!internalSecret || internalSecret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  // Cliente Supabase Admin
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  let automationId = null;

  try {
    const body = await req.json();
    automationId = body.automationId;

    if (!automationId) throw new Error("Automation ID is missing");

    // 1. LOG INICIAL - Garante que o usuário veja que começou
    await logEvent(supabase, automationId, 'processing', 'Iniciando execução da automação...');

    // Busca Automação
    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error("Automação não encontrada.");

    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'error', 'A automação está desativada.');
      return new Response(JSON.stringify({ message: "Automation inactive" }), { headers: corsHeaders });
    }

    // Busca Post
    await logEvent(supabase, automationId, 'processing', 'Buscando post não utilizado...');
    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    
    if (postError || !post) {
      await logEvent(supabase, automationId, 'processing', 'Nenhum post novo encontrado para transformar em story.');
      return new Response(JSON.stringify({ message: "No posts found" }), { headers: corsHeaders });
    }

    await logEvent(supabase, automationId, 'processing', `Post encontrado: "${post.title}". Gerando roteiro...`);

    // Gera Roteiro
    const script = await generateStoryScript(post.content, automation.number_of_pages);
    await logEvent(supabase, automationId, 'processing', `Roteiro gerado com ${script.pages.length} páginas. Iniciando geração de imagens...`);

    // Gera Imagens (Página por Página para evitar timeout em massa e logar progresso)
    const storyPages = [];
    for (let i = 0; i < script.pages.length; i++) {
      const pageData = script.pages[i];
      await logEvent(supabase, automationId, 'processing', `Gerando imagem ${i + 1} de ${script.pages.length}...`);
      
      const imageUrl = await generateImage(pageData.image_prompt, post.author_id, supabase);
      
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

    // Adiciona Link na última página
    if (automation.add_post_link_on_last_page) {
      const lastPage = storyPages[storyPages.length - 1];
      lastPage.outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo Completo'
      };
    }

    // Salva a Story
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

    // Tradução
    if (status === 'published') {
      await logEvent(supabase, automationId, 'processing', 'Disparando tradução automática...', {}, newStory.id);
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-web-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': Deno.env.get('INTERNAL_SECRET_KEY') },
        body: JSON.stringify({ storyId: newStory.id, title: script.title, storyData: { pages: storyPages } }),
      }).catch(err => console.error("Translation trigger failed", err));
    }

    await logEvent(supabase, automationId, 'success', 'Story criada com sucesso!', { storyId: newStory.id }, newStory.id);

    return new Response(JSON.stringify({ success: true, storyId: newStory.id }), { headers: corsHeaders });

  } catch (error) {
    console.error("Error:", error);
    if (automationId) {
      await logEvent(supabase, automationId, 'error', `Falha na execução: ${error.message}`);
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});