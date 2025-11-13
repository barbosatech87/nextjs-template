"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { BlogPost } from "@/types/supabase";

// Tipos para a função de criação
export type NewPostData = Omit<BlogPost, 'id' | 'author_id' | 'created_at' | 'updated_at' | 'status' | 'language_code'> & {
  category_ids: string[];
  status: 'draft' | 'published' | 'archived';
  // Adicionando campos que foram omitidos, mas são necessários no payload
  published_at: string | null;
  scheduled_for: string | null;
};

export async function createPost(postData: NewPostData, lang: string) {
  const supabase = createSupabaseServerClient();
  
  // 1. Verificar autenticação e permissão
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuário não autenticado." };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'writer') {
    return { success: false, message: "Acesso negado." };
  }

  const { category_ids, ...postDetails } = postData;

  // 2. Inserir o post principal
  const { data: newPost, error: postError } = await supabase
    .from("blog_posts")
    .insert({
      ...postDetails,
      author_id: user.id,
      language_code: lang, // Garante que o código do idioma seja salvo
    })
    .select('id, title, summary, content') // Seleciona o conteúdo para a tradução
    .single();

  if (postError) {
    console.error("Error creating post:", postError);
    return { success: false, message: "Falha ao criar o post principal." };
  }

  // 3. Inserir as categorias
  if (category_ids && category_ids.length > 0) {
    const postCategories = category_ids.map(categoryId => ({
      post_id: newPost.id,
      category_id: categoryId,
    }));

    const { error: categoryError } = await supabase
      .from('blog_post_categories')
      .insert(postCategories);

    if (categoryError) {
      console.error("Error inserting post categories:", categoryError);
      // Nota: Não falhamos a operação inteira, mas logamos o erro.
    }
  }

  revalidatePath(`/${lang}/admin/blog`);
  return { 
    success: true, 
    message: "Post criado com sucesso.", 
    postId: newPost.id,
    postContent: {
      title: newPost.title,
      summary: newPost.summary,
      content: newPost.content,
    }
  };
}

export async function deletePost(postId: string, lang: string) {
  const supabase = createSupabaseServerClient();
  
  // Adicionar verificação de permissão de administrador/writer
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuário não autenticado." };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Permite que admins deletem qualquer post, e writers deletem seus próprios posts.
  if (profile?.role === 'writer') {
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', postId)
      .single();
      
    if (fetchError || post?.author_id !== user.id) {
      return { success: false, message: "Acesso negado ou post não encontrado." };
    }
  } else if (profile?.role !== 'admin') {
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