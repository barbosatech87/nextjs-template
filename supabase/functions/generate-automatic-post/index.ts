// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Declarações de tipos para Deno/ESM
declare const Deno: any;
declare const Request: any;
declare const Response: any;

// Cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Lida com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Esta função usa a Service Role Key para ignorar RLS,
    // pois será chamada pelo pg_cron ou por um administrador.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 1. Busca o primeiro agendamento ativo para processar.
    // Nas próximas etapas, esta lógica será mais sofisticada.
    const { data: schedule, error: scheduleError } = await supabase
      .from('automatic_post_schedules')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Não foi possível buscar um agendamento ativo: ${scheduleError.message}`);
    }

    if (!schedule) {
      console.log("Nenhum agendamento ativo encontrado para processar.");
      return new Response(JSON.stringify({ message: "Nenhum agendamento ativo encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Processando agendamento: ${schedule.name} (ID: ${schedule.id})`);

    // TODO nas próximas etapas:
    // 2. Selecionar um versículo único para este agendamento.
    // 3. Chamar a IA para gerar o rascunho do post.
    // 4. Chamar a IA para refinar o post.
    // 5. Chamar a IA para gerar a imagem.
    // 6. Salvar o post no banco de dados.
    // 7. Disparar a função de tradução.

    return new Response(JSON.stringify({ 
      message: "Agendamento ativo encontrado com sucesso. A lógica de geração de post está pendente.",
      schedule_name: schedule.name,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na Edge Function:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});