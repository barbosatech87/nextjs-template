"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string, lang: string) {
  const supabase = createSupabaseServerClient();
  
  // Adicionar verificação de permissão de administrador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuário não autenticado." };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, message: "Acesso negado." };
  }

  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    return { success: false, message: "Falha ao deletar o post." };
  }

  revalidatePath(`/${lang}/admin/blog`);
  return { success: true, message: "Post deletado com sucesso." };
}