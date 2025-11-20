// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Validação de segurança: Garante que quem chama é o n8n (usando um segredo compartilhado)
  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const { logId, status, pinterestId, errorMessage } = await req.json();

    if (!logId || !status) {
      throw new Error("Missing required fields: logId or status.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Prepara os dados para atualização
    const updateData = {
      status: status === 'success' ? 'success' : 'error',
      message: status === 'success' ? `Postado com sucesso via n8n. Pin ID: ${pinterestId || 'N/A'}` : `Erro no n8n: ${errorMessage}`,
      // Atualiza o timestamp para refletir a conclusão
      created_at: new Date().toISOString() 
    };

    // Se houver detalhes adicionais (como o ID do pin), mescla com os detalhes existentes
    if (pinterestId || errorMessage) {
      // Primeiro buscamos o log atual para não perder detalhes anteriores (como o prompt usado)
      const { data: currentLog } = await supabase.from('social_media_post_logs').select('details').eq('id', logId).single();
      
      const newDetails = {
        ...(currentLog?.details || {}),
        n8n_response: {
          pinterestId,
          errorMessage,
          timestamp: new Date().toISOString()
        }
      };
      
      // @ts-ignore
      updateData.details = newDetails;
      
      if (status === 'success' && pinterestId) {
        // @ts-ignore
        updateData.social_media_post_id = pinterestId;
      }
    }

    const { error } = await supabase
      .from('social_media_post_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Callback Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});