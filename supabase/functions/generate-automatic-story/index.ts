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

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_KEY");
const TEXT_MODEL = "openai/gpt-4o-mini:7273183111742847314c856b741010333b454f912a2b2d1e31245b2c1353a2b2";
const IMAGE_MODEL = "black-forest-labs/flux-schnell:a68b898d14f80683df0551f07c1a3035b5f75b03c34e78830c33a7e48ac88b68";

// --- FUNÇÕES DE LOG ---
async function logEvent(supabase, automationId, status, message, details = {}, storyId = null) {
  try {
    const { error } = await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: storyId,
      status,
      message,
      details,
    });
    if (error) console.error(`[FATAL] Failed to log event:`, error.message);
  } catch (logError) {
    console.error(`[FATAL] Exception during logging:`, logError.message);
  }
}

// --- FUNÇÕES DO REPLICATE ---
async function runReplicate(model, input) {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version: model.split(':')[1], input }),
  });
  if (!response.ok) throw new Error(`Replicate API error: ${await response.text()}`);
  
  let prediction = await response.json();
  
  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
    });
    prediction = await pollResponse.json();
  }

  if (prediction.status === "failed") {
    throw new Error(`Replicate prediction failed: ${prediction.error}`);
  }
  
  return prediction.output;
}

// --- FUNÇÕES DE IA ---
async function generateStoryScript(postContent, pageCount) {
  const systemPrompt = `Você é uma IA editora de blog religioso, especialista em criar roteiros para Web Stories do Google Discovery. Sua tarefa é transformar o conteúdo de um post de blog em um roteiro conciso e visual para uma story de ${pageCount} páginas.

Sua saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "title": "Um título curto e impactante para a story (máx 40 caracteres).",
  "summary": "Um resumo muito breve para a story (máx 70 caracteres).",
  "pages": [
    { "page": 1, "caption": "Legenda para a primeira página, introduzindo o tema." },
    { "page": 2, "caption": "Legenda para a segunda página, desenvolvendo o primeiro ponto." },
    ...
    { "page": ${pageCount}, "caption": "Legenda para a última página, com uma conclusão ou chamada para ação." }
  ]
}

Instruções:
- As legendas devem ser curtas, diretas e fáceis de ler.
- Cada legenda deve corresponder a uma página visual da story.
- A narrativa deve fluir logicamente de uma página para a outra.
- Adapte o conteúdo do post, não apenas copie trechos.`;

  const output = await runReplicate(TEXT_MODEL, {
    prompt: `Crie o roteiro JSON para uma Web Story a partir do seguinte post:\n\n${postContent}`,
    system_prompt: systemPrompt,
    prompt_template: "system\n{system_prompt}\nuser\n{prompt}\nassistant\n"
  });

  const jsonString = output.join('');
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Roteiro da Story não retornou um JSON válido.");
  return JSON.parse(jsonMatch[0]);
}

async function generateImagePrompts(storyScript) {
  const systemPrompt = `Você é uma IA editora de design, especialista em temas bíblicos com um estilo de aquarela minimalista para Web Stories do Google Discovery. Sua tarefa é criar prompts de imagem para cada página de um roteiro de story.

Sua saída DEVE ser um objeto JSON com a seguinte estrutura:
{
  "image_prompts": [
    "Prompt para a imagem da página 1...",
    "Prompt para a imagem da página 2...",
    ...
  ]
}

Instruções:
- Crie um prompt para cada legenda do roteiro fornecido.
- Os prompts devem descrever cenas conceituais, simbólicas e artísticas.
- Incorpore o estilo "minimalist watercolor, soft tones, clean background".
- NÃO inclua texto, letras ou números nas descrições.
- Os prompts devem ser em INGLÊS.`;

  const output = await runReplicate(TEXT_MODEL, {
    prompt: `Crie os prompts de imagem em JSON para o seguinte roteiro:\n\n${JSON.stringify(storyScript, null, 2)}`,
    system_prompt: systemPrompt,
    prompt_template: "system\n{system_prompt}\nuser\n{prompt}\nassistant\n"
  });

  const jsonString = output.join('');
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Prompts de imagem não retornaram um JSON válido.");
  return JSON.parse(jsonMatch[0]).image_prompts;
}

async function generateImages(prompts) {
  const imagePromises = prompts.map(prompt => 
    runReplicate(IMAGE_MODEL, {
      prompt: prompt,
      width: 1080,
      height: 1920, // Formato 9:16
      aspect_ratio: "9:16"
    })
  );
  const results = await Promise.all(imagePromises);
  return results.map(output => output[0]); // A API retorna um array com uma URL
}

// --- FUNÇÃO PRINCIPAL ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let automationId = null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    automationId = body.automationId;
    if (!automationId) throw new Error("automationId is required.");

    const { data: automation, error: autoError } = await supabase.from('story_automations').select('*').eq('id', automationId).single();
    if (autoError || !automation) throw new Error(`Automation rule not found: ${autoError?.message}`);
    if (!automation.is_active) {
      await logEvent(supabase, automationId, 'skipped', 'Automação inativa.');
      return new Response(JSON.stringify({ message: "Automation is not active." }), { headers: corsHeaders });
    }

    const { data: post, error: postError } = await supabase.rpc('get_unused_post_for_story_automation', { p_automation_id: automation.id }).single();
    if (postError || !post) {
      await logEvent(supabase, automationId, 'skipped', 'Nenhum post novo para processar.');
      return new Response(JSON.stringify({ message: "No new posts to process." }), { headers: corsHeaders });
    }

    await logEvent(supabase, automationId, 'processing', `Iniciando geração para o post: "${post.title}"`);

    const script = await generateStoryScript(post.content, automation.number_of_pages);
    const imagePrompts = await generateImagePrompts(script);
    const imageUrls = await generateImages(imagePrompts);

    const storyPages = script.pages.map((page, index) => ({
      id: uuidv4(),
      backgroundSrc: imageUrls[index],
      backgroundType: 'image',
      elements: [{
        id: uuidv4(),
        type: 'text',
        content: `<strong>${page.caption}</strong>`,
        style: {
          top: '70%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '32px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '15px', borderRadius: '8px', textAlign: 'center', width: '90%',
        }
      }]
    }));

    if (automation.add_post_link_on_last_page) {
      storyPages[storyPages.length - 1].outlink = {
        href: `https://www.paxword.com/pt/blog/${post.slug}`,
        ctaText: 'Leia o Artigo Completo'
      };
    }

    const storyData = { pages: storyPages };
    const status = automation.publish_automatically ? 'published' : 'draft';

    const { data: newStory, error: storyError } = await supabase.from('web_stories').insert({
      author_id: post.author_id,
      title: script.title,
      slug: generateSlug(script.title),
      story_data: storyData,
      poster_image_src: imageUrls[0],
      status: status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }).select('id').single();

    if (storyError) throw new Error(`Failed to save story: ${storyError.message}`);

    await supabase.from('used_posts_for_stories').insert({
      automation_id: automation.id,
      post_id: post.id,
      story_id: newStory.id,
    });

    if (status === 'published') {
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/translate-web-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': Deno.env.get('INTERNAL_SECRET_KEY') },
        body: JSON.stringify({ storyId: newStory.id, title: script.title, storyData }),
      }).catch(err => console.error("Failed to trigger translation:", err));
    }

    await logEvent(supabase, automationId, 'success', `Story "${script.title}" criada com sucesso.`, { model: IMAGE_MODEL }, newStory.id);

    return new Response(JSON.stringify({ message: "Story created successfully.", storyId: newStory.id }), { headers: corsHeaders });

  } catch (error) {
    console.error("Edge Function Error:", error);
    await logEvent(supabase, automationId, 'error', error.message, { stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateSlug(text) {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}