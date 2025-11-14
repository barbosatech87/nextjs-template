// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Define os cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define o prompt de sistema para garantir o estilo e proibir texto
const SYSTEM_PROMPT = "Conceptual blog post image. The image must be high quality, artistic, and suitable for a Christian blog. CRITICAL: Never include any readable text, numbers, letters, or typography in the image. Focus on abstract or conceptual representation of the theme.";

// Interface para o corpo da requisição
interface ImageGenerationRequest {
  prompt: string;
}

const IMAGE_MODEL = "dall-e-3"; // Usando o nome correto do endpoint da API

serve(async (req: Request) => {
  // Lida com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Autenticação (Verifica se o token está presente)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }
  
  try {
    const { prompt } = await req.json() as ImageGenerationRequest;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing required field: prompt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Combina o prompt do usuário com o prompt de sistema
    const fullPrompt = `${SYSTEM_PROMPT} Theme: ${prompt}`;

    // 2. Chamada à API DALL-E
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL, // Usando 'dall-e-3'
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const imageUrl = data.data[0].url;

    return new Response(JSON.stringify({ 
      imageUrl,
      model: IMAGE_MODEL, // Retornando 'dall-e-3'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});