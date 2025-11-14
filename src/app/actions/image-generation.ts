"use server";

import { createSupabaseServerClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";

export type GeneratedImageData = {
    id: string;
    prompt: string;
    image_url: string;
    created_at: string;
};

export async function getGeneratedImages(): Promise<GeneratedImageData[]> {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('generated_images')
        .select('id, prompt, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching generated images:", error);
        return [];
    }

    return data;
}

export async function deleteGeneratedImage(id: string) {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Usuário não autenticado." };
    }

    const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error deleting image:", error);
        return { success: false, message: "Falha ao deletar a imagem." };
    }

    revalidatePath('/admin/ai-image-generator');
    return { success: true, message: "Imagem deletada com sucesso." };
}