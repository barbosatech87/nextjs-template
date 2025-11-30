// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

const HOST = "www.paxword.com";
const INDEXNOW_API_URL = "https://api.indexnow.org/indexnow";

async function submitUrls(urls, apiKey) {
  if (urls.length === 0) return;

  const payload = {
    host: HOST,
    key: apiKey,
    keyLocation: `https://${HOST}/${apiKey}.txt`,
    urlList: urls,
  };

  const response = await fetch(INDEXNOW_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`IndexNow Submitter: Falha ao enviar URLs. Status: ${response.status}`);
  } else {
    console.log(`IndexNow Submitter: ${urls.length} URL(s) enviadas com sucesso.`);
  }
}

async function markAsSubmitted(supabase, ids, tableName) {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from(tableName)
    .update({ indexnow_submitted_at: new Date().toISOString() })
    .in('id', ids);
  if (error) console.error(`IndexNow Submitter: Erro ao marcar ${tableName} como enviado:`, error);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const internalSecret = req.headers.get('X-Internal-Secret');
  if (internalSecret !== Deno.env.get('INTERNAL_SECRET_KEY')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const apiKey = Deno.env.get('INDEXNOW_API_KEY');
  if (!apiKey) {
    console.error("IndexNow Submitter: INDEXNOW_API_KEY não está configurada.");
    return new Response('Configuration error', { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  try {
    const tablesToProcess = [
      { name: 'blog_posts', path: 'blog' },
      { name: 'pages', path: 'p' },
      { name: 'web_stories', path: 'web-stories' },
    ];

    let allUrlsToSubmit = [];
    
    for (const table of tablesToProcess) {
      const { data, error } = await supabase
        .from(table.name)
        .select('id, slug, language_code')
        .eq('status', 'published')
        .is('indexnow_submitted_at', null);

      if (error) {
        console.error(`IndexNow Submitter: Erro ao buscar em ${table.name}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        const urls = data.map(item => `https://${HOST}/${item.language_code}/${table.path}/${item.slug}`);
        allUrlsToSubmit.push(...urls);
        
        // Marca como enviado imediatamente para evitar reenvios
        await markAsSubmitted(supabase, data.map(item => item.id), table.name);
      }
    }

    if (allUrlsToSubmit.length > 0) {
      await submitUrls(allUrlsToSubmit, apiKey);
    }

    return new Response(JSON.stringify({ success: true, submitted: allUrlsToSubmit.length }), { headers: corsHeaders });

  } catch (e) {
    console.error("IndexNow Submitter Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});