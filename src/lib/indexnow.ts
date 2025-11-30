import { createSupabaseAdminClient } from "@/integrations/supabase/admin";

const INDEXNOW_API_URL = "https://api.indexnow.org/indexnow";
const HOST = "www.paxword.com";

/**
 * Submete uma lista de URLs para a API do IndexNow.
 * Esta função é "dispare e esqueça" e não lança erros para não interromper o fluxo principal.
 * @param urls - Um array de URLs para submeter.
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<void> {
  const apiKey = process.env.INDEXNOW_API_KEY;
  const keyLocation = `${HOST}/${apiKey}.txt`;

  if (!apiKey) {
    console.warn("IndexNow: Chave de API (INDEXNOW_API_KEY) não configurada. Submissão pulada.");
    return;
  }

  if (urls.length === 0) {
    return;
  }

  const payload = {
    host: HOST,
    key: apiKey,
    keyLocation: `https://${keyLocation}`,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Se a resposta não for OK, loga o erro mas não interrompe a execução
      const errorBody = await response.text();
      console.error(`IndexNow: Falha ao submeter URLs. Status: ${response.status}. Resposta: ${errorBody}`);
    } else {
      console.log(`IndexNow: ${urls.length} URL(s) submetidas com sucesso.`);
    }
  } catch (error) {
    console.error("IndexNow: Erro de rede ao tentar submeter URLs.", error);
  }
}

/**
 * Marca uma lista de posts como submetidos ao IndexNow.
 * @param itemIds - Array de IDs dos itens (posts, pages, stories).
 * @param tableName - O nome da tabela ('blog_posts', 'pages', 'web_stories').
 */
export async function markItemsAsSubmitted(itemIds: string[], tableName: 'blog_posts' | 'pages' | 'web_stories'): Promise<void> {
    if (itemIds.length === 0) return;

    try {
        const supabaseAdmin = createSupabaseAdminClient();
        const { error } = await supabaseAdmin
            .from(tableName)
            .update({ indexnow_submitted_at: new Date().toISOString() })
            .in('id', itemIds);

        if (error) {
            console.error(`IndexNow: Falha ao marcar itens como submetidos na tabela ${tableName}.`, error);
        } else {
            console.log(`IndexNow: ${itemIds.length} item(s) marcados como submetidos em ${tableName}.`);
        }
    } catch (error) {
        console.error(`IndexNow: Erro inesperado ao marcar itens como submetidos.`, error);
    }
}