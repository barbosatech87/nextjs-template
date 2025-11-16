"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'blog_images';

export async function uploadImage(file: File) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Usuário não autenticado." };
    }

    // 1. Verificar permissão (apenas admins/writers podem fazer upload)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile for upload:", profileError);
      return { success: false, message: "Falha ao verificar permissões." };
    }

    if (profile?.role !== 'admin' && profile?.role !== 'writer') {
      return { success: false, message: "Acesso negado. Você não tem permissão para fazer upload." };
    }

    // 2. Gerar nome de arquivo único
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    // 3. Upload para o Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error("Supabase Storage Upload Error:", error);
      return { success: false, message: `Falha no upload: ${error.message}` };
    }

    // 4. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      return { success: false, message: "Falha ao obter URL pública." };
    }

    return { success: true, url: publicUrlData.publicUrl };
  } catch (e) {
    console.error("Unexpected error in uploadImage:", e);
    // Este catch é crucial para capturar erros de serialização ou de rede que causam o "Failed to fetch"
    return { success: false, message: "Ocorreu um erro inesperado durante o upload da imagem." };
  }
}