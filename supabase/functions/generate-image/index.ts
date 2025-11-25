// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prompt de sistema simplificado para evitar erros e ser mais direto
const SYSTEM_PROMPT =
  "High-quality, artistic, conceptual image for a Christian blog post. Abstract or symbolic representation. No text, letters, or numbers."

interface ImageGenerationRequest {
  prompt: string
}

const IMAGE_MODEL = "dall-e-3"
const BUCKET_NAME = "blog_images"

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders })
  }

  try {
    const { prompt } = (await req.json()) as ImageGenerationRequest
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing required field: prompt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Junta prompt do usuário com o prompt de sistema
    const fullPrompt = `${SYSTEM_PROMPT}. Theme: ${prompt}`

    // Geração da imagem via OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API Error:", errorText)
      // Retorna o erro detalhado da OpenAI para o cliente
      return new Response(JSON.stringify({ error: `OpenAI API error: ${errorText}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openaiResponse.json()
    const temporaryUrl: string = data.data?.[0]?.url
    if (!temporaryUrl) {
      return new Response(JSON.stringify({ error: "Image URL not returned by OpenAI." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Autenticação do usuário via token
    const token = authHeader.replace("Bearer ", "")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user) {
      console.error("Auth getUser error:", userError)
      return new Response(JSON.stringify({ error: "Invalid user token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const userId = userData.user.id

    // Baixa a imagem temporária
    const imageRes = await fetch(temporaryUrl)
    if (!imageRes.ok) {
      const t = await imageRes.text().catch(() => "")
      console.error("Failed to download generated image:", t)
      return new Response(JSON.stringify({ error: "Failed to download generated image." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }
    const contentType = imageRes.headers.get("content-type") || "image/png"
    const arrayBuffer = await imageRes.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Monta caminho estável no Storage
    const fileExt = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
      ? "jpg"
      : "png"
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `generated/${userId}/${fileName}`

    // Upload no Supabase Storage (bucket existente)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType,
        upsert: false,
        cacheControl: '31536000, immutable' // Cache de 1 ano
      })

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError)
      return new Response(JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // URL pública estável
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    const publicUrl = publicUrlData?.publicUrl
    if (!publicUrl) {
      return new Response(JSON.stringify({ error: "Failed to get public URL." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        model: IMAGE_MODEL,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Edge Function Error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})