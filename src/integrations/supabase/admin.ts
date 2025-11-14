import { createClient } from '@supabase/supabase-js';

// IMPORTANTE: Este cliente só deve ser usado em código do lado do servidor (Server Actions, Route Handlers).
// Ele usa a chave de serviço (service role key) e ignora as políticas de RLS.
export const createSupabaseAdminClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('URL do Supabase ou Chave de Serviço ausentes para o cliente admin');
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};