// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== FUNCTION STARTED ===");
    
    // Validação básica
    const internalSecret = req.headers.get('X-Internal-Secret');
    if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
      console.log("Auth failed");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth OK");

    const body = await req.json();
    const automationId = body.automationId;
    
    console.log(`Automation ID: ${automationId}`);

    if (!automationId) {
      return new Response(
        JSON.stringify({ error: 'Missing automationId' }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    console.log("Supabase client created");

    // Tentar gravar log
    const { error: logError } = await supabase.from('story_automation_logs').insert({
      automation_id: automationId,
      story_id: null,
      status: 'processing',
      message: 'Teste: Função executou com sucesso!',
      details: { test: true, timestamp: new Date().toISOString() }
    });

    if (logError) {
      console.error("Log error:", logError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to write log', 
          details: logError.message 
        }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Log written successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Function executed and logged successfully',
        automationId: automationId
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("FATAL ERROR:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});