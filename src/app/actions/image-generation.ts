"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { Locale } from "@/lib/i18n/config";
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'generated_images';
const EDGE_FUNCTION_URL = `https://xrwnftnfzwbrzijnbhfu.supabase.co/functions/v1/generate-image`;

interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  message?: string;
  model?: string;
}

/**
 * 1. Chama a Edge Function para gerar a imagem.
 * 2. Faz o download da imagem e a salva no Supabase Storage.
 * 3. Retorna a URL pública do Storage.
 */
export async function generateImage(prompt: string, lang: Locale): Promise<GenerationResult> {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Usuário não autenticado." };
  }

  // 1. Verificar permissão (apenas admins/writers podem gerar)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    return { success: false, message: "Acesso negado. Você não tem permissão para gerar imagens." };
  }

  try {
    // 2. Obter token de acesso para autenticar a chamada da Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, message: "Sessão não encontrada." };
    }

    // 3. Chamar a Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Edge Function Error:", data.error);
      return { success: false, message: data.error || "Falha na geração da imagem pela IA." };
    }

    const { imageUrl: tempImageUrl, model } = data;

    // 4. Fazer o download da imagem temporária da OpenAI
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error("Falha ao baixar a imagem gerada.");
    }
    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], `${uuidv4()}.png`, { type: 'image/png' });

    // 5. Salvar a imagem no Supabase Storage
    // O caminho deve ser único e incluir o user.id para RLS de Storage
    const filePath = `${user.id}/${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      // Se o erro persistir, é provável que seja a RLS do Storage.
      return { success: false, message: "Falha ao salvar a imagem no armazenamento. Verifique as permissões do Storage." };
    }

    // 6. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      return { success: false, message: "Falha ao obter URL pública após upload." };
    }

    // 7. Salvar metadados no banco de dados (tabela generated_images)
    const { error: dbError } = await supabase
      .from('generated_images')
      .insert({
        user_id: user.id,
        prompt: prompt,
        image_url: publicUrlData.publicUrl,
        model: model,
      });

    if (dbError) {
      console.error("Database Save Error:", dbError);
      // Se falhar aqui, a imagem ainda está no storage, mas o registro não.
      // Para simplificar, retornamos sucesso se a imagem estiver acessível.
    }

    revalidatePath(`/${lang}/admin/ai-image-generator`);
    return { success: true, imageUrl: publicUrlData.publicUrl, model };

  } catch (error) {
    console.error("Image Generation Action Error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Erro desconhecido durante a geração." };
  }
}

export type GeneratedImage = {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
};

/**
 * Busca todas as imagens geradas pelo usuário logado.
 */
export async function getGeneratedImages(): Promise<GeneratedImage[]> {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('generated_images')
    .select('id, prompt, image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching generated images:", error);
    return [];
  }

  return data || [];
}

/**
 * Deleta uma imagem gerada (do DB e do Storage).
 */
export async function deleteGeneratedImage(imageId: string, imageUrl: string, lang: Locale) {
  const supabase = createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuário não autenticado." };

  // 1. Deletar do banco de dados (RLS garante que só o próprio usuário pode deletar)
  const { error: dbError } = await supabase
    .from('generated_images')
    .delete()
    .eq('id', imageId);

  if (dbError) {
    console.error("Error deleting image from DB:", dbError);
    return { success: false, message: "Falha ao deletar o registro da imagem." };
  }

  // 2. Deletar do Storage
  // Extrai o caminho do arquivo da URL pública
  const pathSegments = imageUrl.split('/');
  const bucketIndex = pathSegments.findIndex(segment => segment === BUCKET_NAME);
  
  if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
    console.warn("Could not parse storage path from URL:", imageUrl);
    // Continua, pois o registro do DB já foi removido
  } else {
    // O caminho é tudo que vem depois do nome do bucket
    // O caminho deve ser 'user_id/nome_do_arquivo.png'
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');
    
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error("Error deleting image from Storage:", storageError);
      // Continua, pois o registro do DB já foi removido
    }
  }

  revalidatePath(`/${lang}/admin/ai-image-generator`);
  return { success: true, message: "Imagem deletada com sucesso." };
}